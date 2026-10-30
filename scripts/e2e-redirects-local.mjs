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
  browserResult,
  videoHashes,
  validateDownload,
} from "./e2e-aes128-local.mjs";

if (process.env.CI) {
  console.log("Skipping local playlist-redirect browser tests in CI.");
  process.exit(0);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browsers = (process.env.E2E_REDIRECT_BROWSERS ?? "brave,firefox").split(
  ",",
);
assert(browsers.every((browser) => ["brave", "firefox"].includes(browser)));
const baselineOnly = process.env.E2E_BASELINE_ONLY === "1";
const cases = [
  { name: "master-302", master: true, source: "clear", baseline: true },
  {
    name: "master-chain",
    master: true,
    chain: true,
    source: "clear",
    baseline: true,
  },
  {
    name: "master-cross-origin",
    master: true,
    crossOrigin: true,
    source: "clear",
    baseline: true,
  },
  ...[
    ["media-ts", "clear"],
    ["media-fmp4", "clear-cmaf"],
    ["encrypted-ts", "implicit"],
    ["encrypted-fmp4", "cmaf"],
  ].map(([name, source]) => ({ name, source, media: true, baseline: true })),
  {
    name: "caption-redirect",
    source: "clear",
    captionRedirect: true,
    subtitles: true,
    baseline: true,
  },
  {
    name: "caption-once",
    source: "clear",
    once: true,
    subtitles: true,
    baseline: true,
  },
  {
    name: "caption-once-redirect",
    source: "clear",
    once: true,
    captionRedirect: true,
    subtitles: true,
    baseline: true,
  },
  ...["ts", "fmp4"].map((kind) => ({
    name: `direct-${kind}`,
    source: `direct-${kind}`,
    direct: true,
    baseline: true,
  })),
  { name: "ts-control", source: "clear" },
  { name: "fmp4-control", source: "clear-cmaf" },
  { name: "encrypted-control", source: "implicit" },
  { name: "caption-control", source: "clear", subtitles: true },
  { name: "master-mkv", master: true, source: "clear", container: "mkv" },
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
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-redirects-real-"));
  console.log(`Evidence directory: ${work}`);
  const results = [],
    requests = [];
  let server,
    cdn,
    cdnBase,
    active,
    complete = false;
  try {
    const { assets, reference } = await createMedia(work);
    const hashes = await videoHashes(reference);
    for (const kind of ["ts", "fmp4"]) {
      const folder = path.join(assets, `direct-${kind}`);
      await fs.mkdir(folder);
      await checked("ffmpeg", [
        "-v",
        "error",
        "-y",
        "-i",
        reference,
        "-c",
        "copy",
        "-hls_time",
        "2",
        "-hls_playlist_type",
        "vod",
        ...(kind === "fmp4"
          ? ["-hls_segment_type", "fmp4", "-hls_flags", "single_file"]
          : []),
        "-hls_segment_filename",
        path.join(folder, kind === "fmp4" ? "stream.mp4" : "segment%d.ts"),
        path.join(folder, "playlist.m3u8"),
      ]);
    }
    const expectedAudio = {};
    for (const source of new Set(cases.map((test) => test.source))) {
      const clearSource =
        source === "implicit"
          ? "clear"
          : source === "cmaf"
            ? "clear-cmaf"
            : source;
      expectedAudio[source] = await audioHash(
        path.join(
          assets,
          clearSource,
          source.startsWith("direct-")
            ? "playlist.m3u8"
            : "audio/playlist.m3u8",
        ),
      );
    }
    const captionText = await fs.readFile(
      path.join(assets, "clear/captions.vtt"),
      "utf8",
    );
    const types = {
      ".m3u8": "application/vnd.apple.mpegurl",
      ".ts": "video/mp2t",
      ".mp4": "video/mp4",
      ".m4s": "video/mp4",
      ".vtt": "text/vtt",
    };
    const serve = async (request, response) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const [name, area, ...rest] = url.pathname.slice(1).split("/");
      const test =
        name === "control"
          ? { source: "clear" }
          : cases.find((test) => test.name === name);
      const entry = {
        case: active?.label,
        url: url.href,
        range: request.headers.range,
      };
      const send = (status, bytes = "", headers = {}) => {
        entry.status = status;
        entry.bytes = Buffer.byteLength(bytes);
        requests.push(entry);
        response.writeHead(status, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          ...headers,
        });
        response.end(bytes);
      };
      try {
        assert(test, `Unknown case: ${name}`);
        const redirect = (location, status = 302) =>
          send(status, "", { Location: location });
        const destination = `${test.crossOrigin ? cdnBase : url.origin}/${name}`;
        if (area === "entry") {
          if (
            rest.join("/") !== (test.direct ? "playlist.m3u8" : "master.m3u8")
          )
            return send(404, "Wrong playlist base URL");
          if (test.chain)
            return redirect(`${destination}/hop/master.m3u8`, 301);
          return redirect(
            `${destination}/${test.direct ? "final/playlist.m3u8" : "cdn/master.m3u8"}?token=fresh`,
            test.crossOrigin ? 307 : 302,
          );
        }
        if (area === "hop")
          return redirect(`${destination}/cdn/master.m3u8?token=fresh`, 307);
        if (area === "caption-entry") {
          if (rest.join("/") !== (test.once ? "once.vtt" : "playlist.m3u8"))
            return send(404, "Wrong caption playlist base URL");
          return redirect(
            `${destination}/caption-final/${test.once ? "once.vtt" : "playlist.m3u8"}?token=fresh`,
            307,
          );
        }
        if (area === "cdn" && test.media && rest.at(-1) === "playlist.m3u8")
          return redirect(
            `${destination}/final/${rest.join("/")}?token=fresh`,
            307,
          );
        // The redirect origin has manifests only. Media and keys exist at the CDN destination.
        if (
          area === "cdn" &&
          test.media &&
          (rest[0] === "video" ||
            rest[0] === "audio" ||
            ["key.bin", "init-key.bin"].includes(rest.join("/")))
        )
          return send(404, "Media exists only at the redirect destination");
        const protectedArea =
          area === "final" ||
          area === "caption-final" ||
          (area === "cdn" && test.master);
        if (protectedArea && url.searchParams.get("token") !== "fresh")
          return send(403, "Expired token");
        let relative = rest.join("/");
        const sourceDir = path.join(assets, test.source);
        let body;
        const extension = path.extname(relative);
        if (area === "cdn" && relative === "master.m3u8") {
          body = await fs.readFile(path.join(sourceDir, "master.m3u8"), "utf8");
          if (test.once || test.captionRedirect)
            body = body.replace(
              'URI="captions.m3u8"',
              `URI="${test.captionRedirect ? `../caption-entry/${test.once ? "once.vtt" : "playlist.m3u8"}` : "once.vtt"}"`,
            );
        } else if (
          (area === "cdn" || area === "caption-final") &&
          relative === "once.vtt" &&
          test.once
        ) {
          active.captionReads++;
          if (active.captionReads > 1)
            return send(403, "Single-use caption URL expired");
          body = captionText;
        } else {
          if (area === "caption-final")
            relative =
              relative === "playlist.m3u8" ? "captions.m3u8" : relative;
          if (!["cdn", "final", "caption-final"].includes(area))
            return send(404, "Wrong playlist base URL");
          const file = path.resolve(sourceDir, relative);
          assert(file.startsWith(sourceDir + path.sep));
          body = await fs.readFile(file);
        }
        if (request.headers.range) {
          const match = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range);
          assert(match && Buffer.isBuffer(body));
          const start = Number(match[1]),
            end = Number(match[2]);
          assert(end < body.length);
          return send(206, body.subarray(start, end + 1), {
            "Content-Type": types[extension] ?? "application/octet-stream",
            "Content-Range": `bytes ${start}-${end}/${body.length}`,
          });
        }
        send(200, body, {
          "Content-Type": types[extension] ?? "application/octet-stream",
        });
      } catch (error) {
        send(404, String(error));
      }
    };
    cdn = http.createServer(serve);
    await new Promise((resolve) => cdn.listen(0, "127.0.0.1", resolve));
    cdnBase = `http://127.0.0.1:${cdn.address().port}`;
    server = http.createServer(serve);
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
        "v5.5.10",
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
    const selected = process.env.E2E_REDIRECT_CASES?.split(",");
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
          active = { label, captionReads: 0 };
          const directURI = `${base}/${test.name}/${test.master || test.direct ? `entry/${test.direct ? "playlist" : "master"}.m3u8` : "cdn/master.m3u8"}?token=old`;
          const env = {
            ...process.env,
            E2E_SKIP_BUILD: "1",
            E2E_KEEP_ARTIFACTS: "1",
            E2E_NATIVE_DOWNLOADS: "1",
            E2E_SKIP_PREVIEW: "1",
            E2E_HLS_URL: `${base}/control/cdn/master.m3u8`,
            E2E_DIRECT_HLS_URL: directURI,
            E2E_DIRECT_MEDIA_PLAYLIST: test.direct ? "1" : "0",
            E2E_SELECT_SUBTITLES: test.subtitles ? "1" : "0",
            E2E_OUTPUT_CONTAINER: test.container ?? "mp4",
            E2E_PARSE_TIMEOUT_MS: build === "baseline" ? "10000" : "30000",
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
          const relevant = requests.filter(
            (entry) =>
              entry.case === label &&
              new URL(entry.url).pathname.startsWith(`/${test.name}/`),
          );
          if (build === "baseline") {
            assert.equal(
              result.ok,
              false,
              "Published build unexpectedly passed",
            );
            assert(
              relevant.some(
                (entry) => entry.status === 403 || entry.status === 404,
              ),
              "No invalid URI or expired caption response was reproduced",
            );
            assert.match(
              result.error,
              /HTTP 40[34]|Download failed|Start download|parsed direct playlist|parsed video|Download job completed|download completion/i,
            );
            if (test.once)
              assert(
                active.captionReads >= 2,
                "Single-use caption URL was not fetched twice",
              );
            results.push({
              browser,
              build,
              ...test,
              error: result.error,
              captionReads: active.captionReads,
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
            const verified = await validateDownload(
              result,
              hashes,
              path.join(work, `${label}.${extension}`),
              test.subtitles ? captionText : undefined,
              { audioOnly: false, includeSubtitles: !!test.subtitles },
            );
            assert.equal(
              verified.audioHash,
              expectedAudio[test.source],
              "Saved audio differs from the complete source track",
            );
            if (test.once)
              assert.equal(
                active.captionReads,
                1,
                "Caption URL was consumed more than once",
              );
            results.push({
              browser,
              build,
              ...test,
              ...verified,
              browserDownload: result.browserDownload,
              captionReads: active.captionReads,
            });
          }
          console.log(`PASS ${label}`);
        }
    complete = true;
  } finally {
    for (const httpServer of [server, cdn])
      if (httpServer) {
        httpServer.closeAllConnections();
        await new Promise((resolve) => httpServer.close(resolve));
      }
    await fs.writeFile(
      path.join(work, "results.json"),
      JSON.stringify({ complete, results, requests }, null, 2),
    );
    console.log(`Evidence retained: ${work}`);
  }
}
await main();
