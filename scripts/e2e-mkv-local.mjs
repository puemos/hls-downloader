#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  run,
  checked,
  createMedia,
  serve,
  browserResult,
  videoHashes,
  validateDownload,
} from "./e2e-aes128-local.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.env.CI) {
  console.log("Skipping local MKV browser tests in CI.");
  process.exit(0);
}
const browsers = (
  process.env.E2E_MKV_BROWSERS ??
  (process.platform === "darwin" ? "chrome128,brave,firefox" : "chrome128")
).split(",");
assert(
  browsers.every((browser) =>
    ["chrome128", "brave", "firefox"].includes(browser),
  ),
  "Unknown browser",
);
const imageName =
  process.env.E2E_CHROME128_IMAGE ?? "hls-downloader-e2e:chrome128";

async function port() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const value = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return value;
}

async function ensureChrome(work) {
  if ((await run("docker", ["image", "inspect", imageName])).code === 0) return;
  const context = path.join(work, "docker-context");
  await fs.mkdir(context);
  await fs.copyFile(
    path.join(root, "scripts/e2e-chrome128.Dockerfile"),
    path.join(context, "Dockerfile"),
  );
  console.log("Building isolated Chrome 128 Linux image");
  await checked("docker", [
    "build",
    "--platform",
    "linux/amd64",
    "-t",
    imageName,
    context,
  ]);
}

async function geckodriver(work) {
  if (process.env.E2E_GECKODRIVER) return process.env.E2E_GECKODRIVER;
  const platform =
    process.platform === "darwin"
      ? `macos${process.arch === "arm64" ? "-aarch64" : ""}`
      : process.arch === "arm64"
        ? "linux-aarch64"
        : "linux64";
  const archive = `geckodriver-v0.37.1-${platform}.tar.gz`;
  const directory = path.join(work, "geckodriver");
  await fs.mkdir(directory);
  await checked("gh", [
    "release",
    "download",
    "v0.37.1",
    "--repo",
    "mozilla/geckodriver",
    "--pattern",
    archive,
    "--dir",
    directory,
  ]);
  await checked("tar", [
    "-xzf",
    path.join(directory, archive),
    "-C",
    directory,
  ]);
  return path.join(directory, "geckodriver");
}

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-mkv-real-"));
  console.log(`Evidence directory: ${work}`);
  const results = [];
  const requests = [];
  let server;
  let complete = false;
  let failure;
  try {
    const { assets, reference } = await createMedia(work);
    server = await serve(
      assets,
      requests,
      browsers.includes("chrome128") ? "0.0.0.0" : "127.0.0.1",
    );
    const serverPort = server.address().port;
    const hashes = await videoHashes(reference);
    const sourceAudio = path.join(assets, "clear/audio/playlist.m3u8");
    const audioHash = async (subtitles) =>
      (
        await checked("ffmpeg", [
          "-v",
          "error",
          "-i",
          sourceAudio,
          ...(!subtitles ? ["-t", "8"] : []),
          "-map",
          "0:a:0",
          "-f",
          "hash",
          "-hash",
          "sha256",
          "-",
        ])
      ).trim();
    const expectedAudio = {
      plain: await audioHash(false),
      subtitles: await audioHash(true),
    };
    if (browsers.includes("chrome128")) await ensureChrome(work);
    if (process.env.E2E_SKIP_BUILD !== "1") {
      console.log("Building all current extension variants");
      await checked("pnpm", ["run", "build:all-variants"]);
    }
    const fixed = {};
    for (const [variant, suffix] of [
      ["standard", ""],
      ["no-blocklist", "-no-blocklist"],
    ]) {
      const directory = path.join(work, "fixed", variant);
      await fs.mkdir(directory, { recursive: true });
      await fs.cp(
        path.join(root, `dist/mv3${suffix}`),
        path.join(directory, "mv3"),
        { recursive: true },
      );
      await fs.copyFile(
        path.join(root, `dist/extension-mv2${suffix}-firefox.xpi`),
        path.join(directory, "firefox.xpi"),
      );
      fixed[variant] = {
        mv3: path.join(directory, "mv3"),
        xpi: path.join(directory, "firefox.xpi"),
      };
    }
    const releases = {};
    if (browsers.includes("chrome128")) {
      for (const version of ["v5.5.0", "v5.5.6"]) {
        const directory = path.join(work, version);
        await fs.mkdir(directory);
        await checked("gh", [
          "release",
          "download",
          version,
          "--repo",
          "puemos/hls-downloader",
          "--pattern",
          "extension-mv3-no-blocklist-chrome.zip",
          "--dir",
          directory,
        ]);
        await checked("unzip", [
          "-q",
          path.join(directory, "extension-mv3-no-blocklist-chrome.zip"),
          "-d",
          path.join(directory, "mv3"),
        ]);
        releases[version] = { mv3: path.join(directory, "mv3") };
      }
    }
    const driver = browsers.includes("firefox")
      ? await geckodriver(work)
      : undefined;
    const cases = [
      {
        browser: "chrome128",
        build: "v5.5.0",
        variant: "no-blocklist",
        container: "mkv",
        txt: true,
      },
      {
        browser: "chrome128",
        build: "v5.5.6",
        variant: "no-blocklist",
        container: "mkv",
        txt: true,
      },
      {
        browser: "chrome128",
        build: "fixed",
        variant: "no-blocklist",
        container: "mkv",
      },
      {
        browser: "chrome128",
        build: "fixed",
        variant: "standard",
        container: "mkv",
        source: "clear-cmaf",
      },
      {
        browser: "chrome128",
        build: "fixed",
        variant: "no-blocklist",
        container: "mp4",
      },
      {
        browser: "brave",
        build: "fixed",
        variant: "no-blocklist",
        container: "mkv",
      },
      {
        browser: "firefox",
        build: "fixed",
        variant: "no-blocklist",
        container: "mkv",
      },
      {
        browser: "firefox",
        build: "fixed",
        variant: "standard",
        container: "mp4",
      },
      {
        browser: "firefox",
        build: "fixed",
        variant: "no-blocklist",
        container: "mkv",
        subtitles: true,
      },
      {
        browser: "brave",
        build: "fixed",
        variant: "standard",
        container: "mkv",
        subtitles: true,
      },
    ].filter((test) => browsers.includes(test.browser));
    for (const [index, test] of cases.entries()) {
      const label = `${test.browser}-${test.build}-${test.variant}-${test.container}${test.subtitles ? "-subtitles" : ""}`;
      console.log(label);
      const extension =
        test.build === "fixed" ? fixed[test.variant] : releases[test.build];
      let containerName;
      let profile;
      const env = {
        ...process.env,
        E2E_SKIP_BUILD: "1",
        E2E_NATIVE_DOWNLOADS: "1",
        E2E_SKIP_PREVIEW: "1",
        E2E_OUTPUT_CONTAINER: test.container,
        E2E_SELECT_SUBTITLES: test.subtitles ? "1" : "0",
        E2E_EXTENSION_DIR: extension.mv3,
        ...(extension.xpi ? { E2E_EXTENSION_XPI: extension.xpi } : {}),
        ...(driver ? { E2E_GECKODRIVER: driver } : {}),
        E2E_HLS_URL: `http://127.0.0.1:${serverPort}/${test.source ?? "clear"}/master.m3u8`,
        E2E_SCREENSHOT_PATH: path.join(work, label + ".png"),
        E2E_CLEAN_DOWNLOAD: "0",
      };
      try {
        if (test.browser === "chrome128") {
          const debugPort = await port();
          const proxyPort = await port();
          const downloads = await fs.mkdtemp(path.join(work, "downloads-"));
          profile = await fs.mkdtemp(path.join(work, "profile-"));
          await fs.mkdir(path.join(profile, "Default"));
          await fs.writeFile(
            path.join(profile, "Default/Preferences"),
            JSON.stringify({
              download: {
                default_directory: downloads,
                directory_upgrade: true,
                prompt_for_download: false,
              },
              safebrowsing: { enabled: true },
            }),
          );
          containerName = `hls-mkv-${process.pid}-${index}`;
          await checked("docker", [
            "run",
            "--rm",
            "-d",
            "--platform",
            "linux/amd64",
            "--name",
            containerName,
            "--label",
            "codex-test=hls-mkv",
            "--memory=2g",
            "--cpus=2",
            "--shm-size=256m",
            "-p",
            `127.0.0.1:${proxyPort}:${proxyPort}`,
            "-v",
            `${work}:${work}`,
            ...(process.platform === "linux"
              ? ["--add-host=host.docker.internal:host-gateway"]
              : []),
            imageName,
            "sh",
            "-c",
            `socat TCP-LISTEN:${proxyPort},fork,bind=0.0.0.0 TCP:127.0.0.1:${debugPort} & exec "$@"`,
            "hls-chrome",
            "/opt/chrome-linux64/chrome",
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            `--remote-debugging-port=${debugPort}`,
            "--no-first-run",
            "--disable-background-networking",
            "--window-size=1280,1000",
            `--user-data-dir=${profile}`,
            `--load-extension=${extension.mv3}`,
          ]);
          Object.assign(env, {
            E2E_CDP_URL: `http://127.0.0.1:${proxyPort}`,
            E2E_PAGE_HOST: "host.docker.internal",
            E2E_DOWNLOAD_DIR: downloads,
            E2E_HLS_URL: `http://host.docker.internal:${serverPort}/${test.source ?? "clear"}/master.m3u8`,
          });
        }
        const child = await run(
          process.execPath,
          [
            path.join(
              root,
              "scripts",
              test.browser === "firefox"
                ? "e2e-firefox-local.mjs"
                : "e2e-local-browser.mjs",
            ),
          ],
          { env },
        );
        const result = browserResult(child.output);
        await fs.writeFile(
          path.join(work, label + ".json"),
          JSON.stringify(result, null, 2),
        );
        assert.equal(child.code, 0, JSON.stringify(result));
        assert.equal(result.ok, true);
        const savedName = path.basename(result.downloadedFile);
        assert.equal(
          savedName,
          `master.${test.txt ? "txt" : test.container}`,
          "Browser saved the wrong filename",
        );
        const mime = result.browserDownload?.mime;
        if (test.txt) assert.equal(mime, "text/plain");
        else if (test.container === "mkv")
          assert(
            ["video/x-matroska", "video/matroska"].includes(mime),
            `Incorrect MKV MIME: ${mime}`,
          );
        else assert.equal(mime, "video/mp4");
        assert.equal(
          result.downloadedContainer,
          test.container === "mkv" ? "matroska" : "mp4",
        );
        const cues = test.subtitles
          ? await fs.readFile(path.join(assets, "clear/captions.vtt"), "utf8")
          : undefined;
        const verified = await validateDownload(
          result,
          hashes,
          path.join(work, `${label}${path.extname(savedName)}`),
          cues,
          { audioOnly: false, includeSubtitles: !!test.subtitles },
        );
        assert.equal(
          verified.audioHash,
          expectedAudio[
            test.build === "fixed" || test.subtitles ? "subtitles" : "plain"
          ],
          "Decoded audio differs from source",
        );
        assert.equal(
          verified.audioFrames,
          test.build === "fixed" || test.subtitles ? 376 : 375,
        );
        results.push({
          ...test,
          browserVersion: result.browser,
          savedName,
          mime,
          ...verified,
        });
        console.log(
          `  ${test.txt ? "Reproduced TXT" : "Verified"}: ${savedName}, ${mime}, ${verified.frames} video frames, ${verified.audioFrames} audio frames`,
        );
      } finally {
        if (containerName) {
          const logs = await run("docker", ["logs", containerName]);
          await fs.writeFile(
            path.join(work, label + "-container.log"),
            logs.output,
          );
          await run("docker", ["stop", containerName]);
        }
        if (profile) await fs.rm(profile, { recursive: true, force: true });
      }
    }
    complete = true;
    console.log(
      `PASS: ${results.length} actual-file cases. Evidence: ${work}/results.json`,
    );
  } catch (error) {
    failure = error.message;
    throw error;
  } finally {
    await fs.writeFile(
      path.join(work, "results.json"),
      JSON.stringify({ complete, failure, browsers, results }, null, 2),
    );
    await fs.writeFile(
      path.join(work, "requests.json"),
      JSON.stringify(requests, null, 2),
    );
    server?.closeAllConnections();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (process.env.E2E_KEEP_ARTIFACTS !== "1")
      await fs.rm(path.join(root, "dist"), { recursive: true, force: true });
  }
}

await main();
