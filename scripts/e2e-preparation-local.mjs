#!/usr/bin/env node
import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  run,
  checked,
  createMedia,
  browserResult,
  videoHashes,
  validateDownload,
} from "./e2e-aes128-local.mjs";

if (process.env.CI) {
  console.log("Skipping local job-preparation browser tests in CI.");
  process.exit(0);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browsers = (
  process.env.E2E_PREPARATION_BROWSERS ?? "brave,firefox"
).split(",");
assert(browsers.every((browser) => ["brave", "firefox"].includes(browser)));
const baselineOnly = process.env.E2E_BASELINE_ONLY === "1";
const cases = [
  ...["video", "audio", "caption"].map((track) => ({
    name: `fail-${track}`,
    source: "clear",
    target: track,
    fault: "fail",
    flow: "prepare-retry",
    subtitles: track === "caption",
    baseline: true,
  })),
  {
    name: "fail-video-fmp4",
    source: "clear-cmaf",
    target: "video",
    fault: "fail",
    flow: "prepare-retry",
    baseline: true,
  },
  {
    name: "fail-caption-encrypted",
    source: "encrypted-captions",
    target: "caption",
    fault: "fail",
    flow: "prepare-retry",
    subtitles: true,
    baseline: true,
  },
  ...["video", "audio", "both"].map((track) => ({
    name: `empty-${track}`,
    source: "clear",
    target: track,
    fault: "empty",
    flow: "prepare-retry",
    baseline: true,
  })),
  ...["video", "audio", "caption"].map((track) => ({
    name: `cancel-${track}`,
    source: "clear",
    target: track,
    fault: "stall",
    flow: "prepare-cancel",
    subtitles: track === "caption",
    baseline: true,
  })),
  { name: "ts-control", source: "clear" },
  { name: "fmp4-control", source: "clear-cmaf" },
  { name: "encrypted-ts-control", source: "implicit" },
  { name: "encrypted-fmp4-control", source: "cmaf" },
  {
    name: "encrypted-caption-control",
    source: "encrypted-captions",
    subtitles: true,
  },
  { name: "empty-caption-control", source: "empty-captions", subtitles: true },
  { name: "mkv-control", source: "clear", container: "mkv" },
  {
    name: "audio-primary-control",
    source: "audio-primary",
    audioOnly: true,
    direct: true,
  },
  {
    name: "redirect-control",
    source: "clear",
    redirect: true,
    subtitles: true,
  },
];

async function driver(work) {
  if (process.env.E2E_GECKODRIVER) return process.env.E2E_GECKODRIVER;
  const folder = path.join(work, "driver");
  await fs.mkdir(folder);
  const platform =
    process.platform === "darwin"
      ? `macos${process.arch === "arm64" ? "-aarch64" : ""}`
      : process.arch === "arm64"
        ? "linux-aarch64"
        : "linux64";
  const archive = `geckodriver-v0.37.1-${platform}.tar.gz`;
  await checked("gh", [
    "release",
    "download",
    "v0.37.1",
    "--repo",
    "mozilla/geckodriver",
    "--pattern",
    archive,
    "--dir",
    folder,
  ]);
  await checked("tar", ["-xzf", path.join(folder, archive), "-C", folder]);
  return path.join(folder, "geckodriver");
}
async function audioHash(file) {
  return (
    await checked("ffmpeg", [
      "-v",
      "error",
      "-i",
      file,
      "-map",
      "0:a:0",
      "-f",
      "hash",
      "-hash",
      "sha256",
      "-",
    ])
  ).trim();
}

async function main() {
  const work = await fs.mkdtemp(
    path.join(os.tmpdir(), "hls-preparation-real-"),
  );
  console.log(`Evidence directory: ${work}`);
  const results = [],
    requests = [];
  let server,
    active,
    complete = false;
  try {
    const { assets, reference } = await createMedia(work);
    const hashes = await videoHashes(reference);
    const captions = await fs.readFile(
      path.join(assets, "clear/captions.vtt"),
      "utf8",
    );
    await fs.cp(
      path.join(assets, "clear/audio"),
      path.join(assets, "audio-primary"),
      { recursive: true },
    );
    await fs.cp(
      path.join(assets, "clear"),
      path.join(assets, "empty-captions"),
      { recursive: true },
    );
    await fs.writeFile(
      path.join(assets, "empty-captions/captions.vtt"),
      "WEBVTT\n\n",
    );
    await fs.cp(
      path.join(assets, "implicit"),
      path.join(assets, "encrypted-captions"),
      { recursive: true },
    );
    const key = randomBytes(16),
      iv = Buffer.alloc(16);
    iv.writeBigUInt64BE(42n, 8);
    const cipher = createCipheriv("aes-128-cbc", key, iv);
    await fs.writeFile(
      path.join(assets, "encrypted-captions/caption-key.bin"),
      key,
    );
    await fs.writeFile(
      path.join(assets, "encrypted-captions/captions.vtt"),
      Buffer.concat([cipher.update(captions), cipher.final()]),
    );
    await fs.writeFile(
      path.join(assets, "encrypted-captions/captions.m3u8"),
      '#EXTM3U\n#EXT-X-TARGETDURATION:8\n#EXT-X-MEDIA-SEQUENCE:42\n#EXT-X-KEY:METHOD=AES-128,URI="caption-key.bin"\n#EXTINF:8,\ncaptions.vtt\n#EXT-X-ENDLIST\n',
    );
    const expectedAudio = {};
    for (const source of new Set(cases.map((test) => test.source))) {
      const clear =
        source === "cmaf"
          ? "clear-cmaf"
          : ["implicit", "encrypted-captions"].includes(source)
            ? "clear"
            : source;
      expectedAudio[source] = await audioHash(
        path.join(
          assets,
          clear,
          source === "audio-primary" ? "playlist.m3u8" : "audio/playlist.m3u8",
        ),
      );
    }
    const types = {
      ".m3u8": "application/vnd.apple.mpegurl",
      ".ts": "video/mp2t",
      ".m4s": "video/mp4",
      ".mp4": "video/mp4",
      ".vtt": "text/vtt",
    };
    server = http.createServer(async (request, response) => {
      const url = new URL(request.url, "http://localhost");
      const [name, ...rest] = url.pathname.slice(1).split("/");
      const context = active;
      if (name === "__control") {
        if (rest[0] === "arm")
          Object.assign(context, { armed: true, stalled: false, closedAt: 0 });
        if (rest[0] === "release") context.armed = false;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            armed: context.armed,
            hits: context.hits,
            stalled: context.stalled,
            closedAt: context.closedAt,
            closedRequests: context.closedRequests,
          }),
        );
        return;
      }
      const entry = {
        case: context?.label,
        path: url.pathname,
        query: url.search,
      };
      const send = (status, body = "", headers = {}) => {
        requests.push({ ...entry, status, bytes: Buffer.byteLength(body) });
        response.writeHead(status, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          ...headers,
        });
        response.end(body);
      };
      try {
        const test =
          name === "control"
            ? { source: "clear" }
            : cases.find((test) => test.name === name);
        assert(test);
        let relative = rest.join("/");
        if (test.redirect) {
          if (relative === "entry/master.m3u8")
            return send(302, "", {
              Location: `/${name}/cdn/master.m3u8?token=fresh`,
            });
          if (
            !relative.startsWith("cdn/") ||
            url.searchParams.get("token") !== "fresh"
          )
            return send(403, "Expired token");
          relative = relative.slice(4);
        }
        const manifest =
          relative === "captions.m3u8"
            ? "caption"
            : relative === "video/playlist.m3u8"
              ? "video"
              : relative === "audio/playlist.m3u8"
                ? "audio"
                : null;
        const target =
          manifest &&
          (test.target === manifest ||
            (test.target === "both" && manifest !== "caption"));
        if (context?.armed && context.test.name === name && target) {
          context.hits++;
          if (test.fault === "fail")
            return send(403, "Temporary playlist authorization failure");
          if (test.fault === "empty")
            return send(
              200,
              "#EXTM3U\n#EXT-X-TARGETDURATION:8\n#EXT-X-ENDLIST\n",
              { "Content-Type": types[".m3u8"] },
            );
          if (test.fault === "stall") {
            context.stalled = true;
            requests.push({ ...entry, status: 200, stalled: true });
            response.writeHead(200, {
              "Content-Type": types[".m3u8"],
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-store",
            });
            response.flushHeaders();
            response.write("#EXTM3U\n");
            response.on("close", () => {
              context.closedAt = Date.now();
              context.closedRequests++;
              context.armed = false;
            });
            return;
          }
        }
        const folder = path.join(assets, test.source),
          file = path.resolve(folder, relative);
        assert(file.startsWith(folder + path.sep));
        const body = await fs.readFile(file);
        send(200, body, {
          "Content-Type":
            types[path.extname(file)] ?? "application/octet-stream",
        });
      } catch (error) {
        send(404, String(error));
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const baseline = path.join(work, "baseline");
    await fs.mkdir(baseline);
    for (const archive of [
      "extension-mv3-chrome.zip",
      "extension-mv2-firefox.xpi",
    ])
      await checked("gh", [
        "release",
        "download",
        "v5.5.11",
        "--pattern",
        archive,
        "--dir",
        baseline,
      ]);
    await checked("unzip", [
      "-q",
      path.join(baseline, "extension-mv3-chrome.zip"),
      "-d",
      path.join(baseline, "mv3"),
    ]);
    if (!baselineOnly && process.env.E2E_SKIP_BUILD !== "1")
      await checked("pnpm", ["run", "build:all-variants"]);
    const geckodriver = browsers.includes("firefox")
      ? await driver(work)
      : undefined;
    const selected = process.env.E2E_PREPARATION_CASES?.split(",");
    for (const browser of browsers)
      for (const build of ["baseline", ...(!baselineOnly ? ["fixed"] : [])])
        for (const test of cases.filter(
          (test) =>
            (!selected || selected.includes(test.name)) &&
            (build !== "baseline" ||
              (test.baseline && process.env.E2E_SKIP_BASELINE !== "1")),
        )) {
          const label = `${browser}-${build}-${test.name}`;
          console.log(label);
          active = {
            label,
            test,
            armed: false,
            hits: 0,
            stalled: false,
            closedAt: 0,
            closedRequests: 0,
          };
          const env = {
            ...process.env,
            E2E_SKIP_BUILD: "1",
            E2E_KEEP_ARTIFACTS: "1",
            E2E_NATIVE_DOWNLOADS: "1",
            E2E_SKIP_PREVIEW: "1",
            E2E_HLS_URL: `${base}/control/master.m3u8`,
            E2E_DIRECT_HLS_URL: `${base}/${test.name}/${test.redirect ? "entry/master.m3u8?token=old" : test.direct ? "playlist.m3u8" : "master.m3u8"}`,
            E2E_DIRECT_MEDIA_PLAYLIST: test.direct ? "1" : "0",
            E2E_SELECT_SUBTITLES: test.subtitles ? "1" : "0",
            E2E_OUTPUT_CONTAINER: test.container ?? "mp4",
            E2E_JOB_FLOW: test.flow ?? "",
            E2E_CONTROL_URL: `${base}/__control/status`,
            E2E_JOB_TIMEOUT_MS: build === "baseline" ? "30000" : "120000",
            ...(geckodriver ? { E2E_GECKODRIVER: geckodriver } : {}),
            E2E_EXTENSION_DIR:
              build === "baseline"
                ? path.join(baseline, "mv3")
                : path.join(root, "dist/mv3"),
            E2E_EXTENSION_XPI:
              build === "baseline"
                ? path.join(baseline, "extension-mv2-firefox.xpi")
                : path.join(root, "dist/extension-mv2-firefox.xpi"),
          };
          const output = await run(
            process.execPath,
            [
              browser === "firefox"
                ? "scripts/e2e-firefox-local.mjs"
                : "scripts/e2e-local-browser.mjs",
            ],
            { env },
          );
          await fs.writeFile(path.join(work, `${label}.log`), output.output);
          const result = browserResult(output.output);
          if (test.fault)
            assert(active.hits > 0, "Preparation fault was not exercised");
          if (build === "baseline") {
            assert.equal(
              result.ok,
              false,
              "Published build unexpectedly passed",
            );
            assert.match(
              result.error,
              /Preparation did not show|Cancel|cancelled request|stalled media/i,
            );
            const saved = [];
            if (result.downloadDirectory)
              for (const name of await fs.readdir(result.downloadDirectory)) {
                if (!/\.(mp4|mkv)$/.test(name)) continue;
                const source = path.join(result.downloadDirectory, name),
                  file = path.join(work, `${label}-${name}`);
                await fs.copyFile(source, file);
                const probe = JSON.parse(
                  await checked("ffprobe", [
                    "-v",
                    "error",
                    "-show_entries",
                    "stream=codec_type,nb_read_frames",
                    "-count_frames",
                    "-of",
                    "json",
                    file,
                  ]),
                );
                const tracks = probe.streams.map((stream) => stream.codec_type);
                assert(
                  test.fault === "empty" &&
                    (!tracks.includes("video") || !tracks.includes("audio")),
                  "Unexpected baseline export",
                );
                saved.push({ file, streams: probe.streams });
              }
            results.push({
              browser,
              build,
              ...test,
              error: result.error,
              faultHits: active.hits,
              baselineSavedFiles: saved,
            });
          } else {
            assert.equal(result.ok, true, result.error);
            assert.equal(output.code, 0, output.output.slice(-5000));
            const extension =
              test.subtitles || test.container === "mkv" ? "mkv" : "mp4";
            assert.equal(result.browserDownload.state, "complete");
            assert(result.browserDownload.filename.endsWith(`.${extension}`));
            assert.equal(
              result.downloadedContainer,
              extension === "mkv" ? "matroska" : "mp4",
            );
            if (test.flow === "prepare-retry")
              assert.equal(result.flowEvidence.retriedPreparation, true);
            if (test.flow === "prepare-cancel") {
              assert.equal(result.flowEvidence.cancelledRequests, 6);
              assert.equal(active.closedRequests, 6);
            }
            const verified = await validateDownload(
              result,
              test.audioOnly ? [] : hashes,
              path.join(work, `${label}.${extension}`),
              test.subtitles
                ? test.source === "empty-captions"
                  ? "WEBVTT\n\n"
                  : captions
                : undefined,
              {
                audioOnly: !!test.audioOnly,
                includeSubtitles: !!test.subtitles,
              },
            );
            assert.equal(
              verified.audioHash,
              expectedAudio[test.source],
              "Saved audio differs from the complete source track",
            );
            results.push({
              browser,
              build,
              ...test,
              ...verified,
              faultHits: active.hits,
              browserDownload: result.browserDownload,
              flowEvidence: result.flowEvidence,
            });
          }
          console.log(`PASS ${label}`);
        }
    complete = true;
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    await fs.writeFile(
      path.join(work, "results.json"),
      JSON.stringify({ complete, results, requests }, null, 2),
    );
    console.log(`Evidence retained: ${work}`);
  }
}
await main();
