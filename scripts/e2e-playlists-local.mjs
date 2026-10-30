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
  console.log("Skipping local playlist browser tests in CI.");
  process.exit(0);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browsers = (process.env.E2E_PLAYLIST_BROWSERS ?? "brave,firefox").split(
  ",",
);
assert(browsers.every((browser) => ["brave", "firefox"].includes(browser)));
const baselineOnly = process.env.E2E_BASELINE_ONLY === "1";
const captions = [
  "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nFirst encrypted caption\n",
  "WEBVTT\n\n00:00:04.000 --> 00:00:08.000\nLast encrypted caption\n",
];
const expectedCaptions = captions.map((text) => text.trim()).join("\n\n");

function encrypt(bytes, key, sequence) {
  const iv = Buffer.alloc(16);
  iv.writeBigUInt64BE(BigInt(sequence), 8);
  const cipher = createCipheriv("aes-128-cbc", key, iv);
  return Buffer.concat([cipher.update(bytes), cipher.final()]);
}

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

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-playlists-real-"));
  console.log(`Evidence directory: ${work}`);
  const results = [],
    requests = [];
  let server,
    active,
    complete = false;
  try {
    const { assets, reference } = await createMedia(work);
    const hashes = await videoHashes(reference);
    for (const name of ["direct-ts", "direct-fmp4"]) {
      const folder = path.join(assets, name);
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
        ...(name === "direct-fmp4"
          ? ["-hls_segment_type", "fmp4", "-hls_flags", "single_file"]
          : []),
        "-hls_segment_filename",
        path.join(
          folder,
          name === "direct-fmp4" ? "stream.mp4" : "segment%d.ts",
        ),
        path.join(folder, "playlist.m3u8"),
      ]);
    }
    for (const kind of [
      "implicit",
      "explicit",
      "rotation",
      "clear-lead",
      "range",
    ]) {
      const folder = path.join(assets, `captions-${kind}`);
      await fs.cp(path.join(assets, "implicit"), folder, { recursive: true });
      const key = randomBytes(16),
        nextKey = randomBytes(16);
      await fs.writeFile(path.join(folder, "captions-key.bin"), key);
      await fs.writeFile(path.join(folder, "captions-key2.bin"), nextKey);
      const encrypted = captions.map((text, index) =>
        kind === "clear-lead" && index === 0
          ? Buffer.from(text)
          : encrypt(
              Buffer.from(text),
              kind === "rotation" && index === 1 ? nextKey : key,
              kind === "explicit" ? 99 : 42 + index,
            ),
      );
      const tag = `#EXT-X-KEY:METHOD=AES-128,URI="captions-key.bin"${kind === "explicit" ? ",IV=0x00000000000000000000000000000063" : ""}`;
      const lines = [
        "#EXTM3U",
        "#EXT-X-TARGETDURATION:4",
        "#EXT-X-MEDIA-SEQUENCE:42",
      ];
      if (kind !== "clear-lead") lines.push(tag);
      let offset = 0;
      for (let index = 0; index < 2; index++) {
        if (kind === "rotation" && index === 1)
          lines.push('#EXT-X-KEY:METHOD=AES-128,URI="captions-key2.bin"');
        if (kind === "clear-lead" && index === 1) lines.push(tag);
        lines.push("#EXTINF:4,");
        if (kind === "range")
          lines.push(
            `#EXT-X-BYTERANGE:${encrypted[index].length}@${offset}`,
            "captions.bin",
          );
        else {
          lines.push(`captions${index}.vtt`);
          await fs.writeFile(
            path.join(folder, `captions${index}.vtt`),
            encrypted[index],
          );
        }
        offset += encrypted[index].length;
      }
      if (kind === "range")
        await fs.writeFile(
          path.join(folder, "captions.bin"),
          Buffer.concat(encrypted),
        );
      lines.push("#EXT-X-ENDLIST", "");
      await fs.writeFile(path.join(folder, "captions.m3u8"), lines.join("\n"));
    }
    const aliases = {
      "audio-mime": { mime: "audio/mpegurl", name: "master.m3u8" },
      extensionless: {
        mime: "application/vnd.apple.mpegurl",
        name: "manifest",
      },
      generic: { mime: "application/octet-stream", name: "master.m3u8" },
      m3u: { mime: "application/vnd.apple.mpegurl", name: "master.m3u" },
    };
    const types = {
      ".m3u8": "application/vnd.apple.mpegurl",
      ".ts": "video/mp2t",
      ".m4s": "video/mp4",
      ".mp4": "video/mp4",
      ".vtt": "text/vtt",
    };
    server = http.createServer(async (request, response) => {
      try {
        const url = new URL(request.url, "http://127.0.0.1");
        if (url.pathname === "/page") {
          const target = url.searchParams.get("target");
          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(
            `<!doctype html><title>HLS Capture Regression</title><script>window.hlsFetchDone=false; const xhr=new XMLHttpRequest(); xhr.open('GET',${JSON.stringify(target)}); xhr.onload=()=>{window.hlsFetchStatus=xhr.status;window.hlsFetchBody=xhr.responseText;window.hlsFetchDone=true;};xhr.send();</script>`,
          );
          return;
        }
        let relative = url.pathname;
        const prefix = relative.split("/")[1],
          alias = aliases[prefix];
        if (alias)
          relative = relative
            .replace(`/${prefix}/`, "/clear/")
            .replace(`/${alias.name}`, "/master.m3u8");
        const file = path.resolve(assets, `.${relative}`);
        assert(file.startsWith(assets + path.sep));
        let bytes = await fs.readFile(file),
          status = 200;
        const mime =
          alias && path.extname(file) === ".m3u8"
            ? alias.mime
            : (types[path.extname(file)] ?? "application/octet-stream");
        const entry = {
          case: active,
          path: url.pathname,
          mime,
          status,
          range: request.headers.range,
        };
        if (request.headers.range) {
          const match = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range);
          assert(match);
          const start = Number(match[1]),
            end = Number(match[2]);
          assert(end < bytes.length);
          response.setHeader(
            "Content-Range",
            `bytes ${start}-${end}/${bytes.length}`,
          );
          bytes = bytes.subarray(start, end + 1);
          status = entry.status = 206;
        }
        requests.push(entry);
        response.writeHead(status, {
          "Content-Type": mime,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        });
        response.end(bytes);
      } catch (error) {
        response.writeHead(404);
        response.end(String(error));
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const baseline = path.join(work, "baseline");
    await fs.mkdir(baseline);
    for (const name of [
      "extension-mv3-chrome.zip",
      "extension-mv2-firefox.xpi",
    ])
      await checked("gh", [
        "release",
        "download",
        "v5.5.8",
        "--pattern",
        name,
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
    const cases = [
      ...Object.keys(aliases).map((name) => ({
        name,
        capture: true,
        baseline: name !== "m3u",
      })),
      { name: "direct-ts", direct: "/direct-ts/playlist.m3u8", baseline: true },
      { name: "direct-fmp4", direct: "/direct-fmp4/playlist.m3u8" },
      {
        name: "direct-audio",
        direct: "/clear/audio/playlist.m3u8",
        audioOnly: true,
      },
      ...["implicit", "explicit", "rotation", "clear-lead", "range"].map(
        (kind) => ({
          name: `captions-${kind}`,
          subtitles: true,
          baseline: kind === "implicit",
        }),
      ),
      { name: "clear", subtitles: true },
    ];
    const selection = process.env.E2E_PLAYLIST_CASES?.split(",");
    for (const browser of browsers)
      for (const build of ["baseline", ...(!baselineOnly ? ["fixed"] : [])])
        for (const test of cases.filter(
          (test) =>
            (!selection || selection.includes(test.name)) &&
            (build !== "baseline" ||
              (test.baseline && process.env.E2E_SKIP_BASELINE !== "1")),
        )) {
          const label = (active = `${browser}-${build}-${test.name}`);
          console.log(label);
          const hlsUrl = `${base}/${test.capture ? `${test.name}/${aliases[test.name].name}` : test.direct ? "clear/master.m3u8" : `${test.name}/master.m3u8`}`;
          const env = {
            ...process.env,
            E2E_SKIP_BUILD: "1",
            E2E_NATIVE_DOWNLOADS: "1",
            E2E_KEEP_ARTIFACTS: "1",
            E2E_SKIP_PREVIEW: "1",
            E2E_SELECT_SUBTITLES: test.subtitles ? "1" : "0",
            E2E_HLS_URL: hlsUrl,
            E2E_HLS_MIME: test.capture
              ? aliases[test.name].mime
              : "application/vnd.apple.mpegurl",
            E2E_CAPTURE_TIMEOUT_MS: "5000",
            E2E_JOB_TIMEOUT_MS: "30000",
            E2E_PARSE_TIMEOUT_MS: build === "baseline" ? "5000" : "20000",
            E2E_DIRECT_MEDIA_PLAYLIST: test.direct ? "1" : "0",
            ...(test.direct ? { E2E_DIRECT_HLS_URL: base + test.direct } : {}),
            ...(test.capture
              ? {
                  E2E_CAPTURE_PAGE: `${base}/page?target=${encodeURIComponent(hlsUrl)}`,
                }
              : {}),
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
          if (build === "baseline") {
            if (result.ok) {
              assert(test.subtitles, `Old build unexpectedly passed ${label}`);
              const saved = await validateDownload(
                result,
                hashes,
                path.join(work, `${label}.mkv`),
                undefined,
                { includeSubtitles: false },
              );
              const text = await run("ffmpeg", [
                "-v",
                "error",
                "-i",
                saved.savedFile,
                "-map",
                "0:s:0",
                "-f",
                "webvtt",
                "-",
              ]);
              assert(
                !text.output.includes("First encrypted caption") &&
                  !text.output.includes("Last encrypted caption"),
                "Old build preserved the captions unexpectedly",
              );
              results.push({
                browser,
                build,
                ...test,
                ...saved,
                error: "Completed MKV is missing the expected caption cues",
                savedCaptions: text.output,
              });
            } else {
              const expectedFailure = test.capture
                ? /Sniffer popup row|captured HLS playlist/
                : test.direct
                  ? /parsed direct playlist|parsed video, audio/
                  : /Download failed|FFmpeg|prepare.*download/i;
              assert(expectedFailure.test(result.error), result.error);
              assert.equal(
                (await fs.readdir(result.downloadDirectory)).length,
                0,
                "Old build saved an incomplete file",
              );
              results.push({ browser, build, ...test, error: result.error });
            }
          } else {
            assert.equal(output.code, 0, output.output.slice(-7000));
            assert.equal(result.ok, true, result.error);
            const extension = test.subtitles ? "mkv" : "mp4";
            const saved = await validateDownload(
              result,
              hashes,
              path.join(work, `${label}.${extension}`),
              test.subtitles
                ? test.name === "clear"
                  ? await fs.readFile(
                      path.join(assets, "clear/captions.vtt"),
                      "utf8",
                    )
                  : expectedCaptions
                : undefined,
              {
                audioOnly: !!test.audioOnly,
                includeSubtitles: !!test.subtitles,
              },
            );
            const sourceAudio = test.direct
              ? path.join(assets, test.direct.slice(1))
              : path.join(assets, "clear/audio/playlist.m3u8");
            const expectedAudio = (
              await checked("ffmpeg", [
                "-v",
                "error",
                "-i",
                sourceAudio,
                "-map",
                "0:a:0",
                "-f",
                "hash",
                "-hash",
                "sha256",
                "-",
              ])
            ).trim();
            assert.equal(
              saved.audioHash,
              expectedAudio,
              "Saved audio differs from the full source",
            );
            assert(result.browserDownload.filename.endsWith(`.${extension}`));
            assert.equal(
              result.downloadedContainer,
              test.subtitles ? "matroska" : "mp4",
            );
            results.push({
              browser,
              build,
              ...test,
              ...saved,
              browserVersion: result.browser,
              browserDownload: result.browserDownload,
            });
          }
          if (test.capture)
            assert(
              requests.some(
                (entry) =>
                  entry.case === label &&
                  entry.path === `/${test.name}/${aliases[test.name].name}` &&
                  entry.status === 200,
              ),
              "No genuine HLS response was served to the page",
            );
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
