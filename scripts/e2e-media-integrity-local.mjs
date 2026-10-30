#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
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
} from "./e2e-aes128-local.mjs";

if (process.env.CI) {
  console.log("Skipping local media-integrity browser tests in CI.");
  process.exit(0);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browsers = (process.env.E2E_INTEGRITY_BROWSERS ?? "brave,firefox").split(
  ",",
);
assert(browsers.every((browser) => ["brave", "firefox"].includes(browser)));
const baselineOnly = process.env.E2E_BASELINE_ONLY === "1";

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

const exec = promisify(execFile);
class MediaDecodeError extends Error {}

async function media(file) {
  const decoded = await run("ffmpeg", [
    "-v",
    "error",
    "-xerror",
    "-i",
    file,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-f",
    "null",
    "-",
  ]);
  if (decoded.code !== 0) {
    // Tool/process failures must not count as reproductions of corrupt media.
    assert.match(
      decoded.output,
      /Invalid NAL unit|Invalid data found|Error (?:while )?decod|corrupt decoded frame|Invalid packet|Packet corrupt/i,
    );
    throw new MediaDecodeError(decoded.output);
  }
  const { stdout } = await exec(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_streams",
      "-count_frames",
      "-show_format",
      "-of",
      "json",
      file,
    ],
    { timeout: 300_000, maxBuffer: 8 * 1024 * 1024 },
  );
  const probe = JSON.parse(stdout);
  const frames = await videoHashes(file);
  return {
    frames,
    audioHash: await audioHash(file),
    audioFrames: Number(
      probe.streams.find((s) => s.codec_type === "audio").nb_read_frames,
    ),
    codec: probe.streams.find((s) => s.codec_type === "audio").codec_name,
    duration: Number(probe.format.duration),
  };
}

function cues(text) {
  const time = (value) =>
    Math.round(
      value.split(":").reduce((total, part) => total * 60 + Number(part), 0) *
        1000,
    );
  return text.split(/\r?\n\s*\r?\n/).flatMap((block) => {
    const lines = block.split(/\r?\n/),
      index = lines.findIndex((line) => line.includes(" --> "));
    if (index < 0) return [];
    const [start, end] = lines[index].split(" --> ");
    return [
      {
        start: time(start),
        end: time(end.split(/\s/)[0]),
        text: lines
          .slice(index + 1)
          .join("\n")
          .trim(),
      },
    ];
  });
}

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-integrity-real-"));
  console.log(`Evidence directory: ${work}`);
  const results = [],
    requests = [];
  let server,
    active,
    complete = false;
  try {
    const { assets, reference } = await createMedia(work);
    for (const [name, codec, videoSeconds, audioSeconds] of [
      ["short-audio", "aac", 8, 3],
      ["long-audio", "aac", 3, 8],
      ["ac3", "ac3", 8, 8],
      ["eac3", "eac3", 8, 8],
      ["mp3", "libmp3lame", 8, 8],
      ["ranged", "aac", 8, 8],
    ]) {
      const folder = path.join(assets, name);
      await fs.cp(path.join(assets, "clear"), folder, { recursive: true });
      for (const [track, map, duration] of [
        ["video", "0:v:0", videoSeconds],
        ["audio", "0:a:0", audioSeconds],
      ]) {
        await checked("ffmpeg", [
          "-v",
          "error",
          "-y",
          "-i",
          reference,
          "-map",
          map,
          "-t",
          String(duration),
          ...(track === "audio" && codec !== "aac"
            ? ["-c:a", codec, "-b:a", "128k"]
            : ["-c", "copy"]),
          "-hls_time",
          "2",
          "-hls_playlist_type",
          "vod",
          ...(name === "ranged"
            ? ["-hls_segment_type", "fmp4", "-hls_flags", "single_file"]
            : []),
          "-hls_segment_filename",
          path.join(
            folder,
            track,
            name === "ranged" ? "stream.mp4" : "segment%d.ts",
          ),
          path.join(folder, track, "playlist.m3u8"),
        ]);
      }
      if (codec !== "aac") {
        const file = path.join(folder, "master.m3u8");
        await fs.writeFile(
          file,
          (await fs.readFile(file, "utf8")).replace(/,CODECS="[^"]+"/, ""),
        );
      }
    }
    const expected = {};
    for (const name of [
      "clear",
      "short-audio",
      "long-audio",
      "ac3",
      "eac3",
      "mp3",
      "ranged",
    ]) {
      const audio = path.join(assets, name, "audio/playlist.m3u8");
      const probe = JSON.parse(
        await checked("ffprobe", [
          "-v",
          "error",
          "-show_streams",
          "-of",
          "json",
          audio,
        ]),
      );
      expected[name] = {
        frames: await videoHashes(
          path.join(assets, name, "video/playlist.m3u8"),
        ),
        audioHash: await audioHash(audio),
        codec: probe.streams.find((s) => s.codec_type === "audio").codec_name,
      };
    }
    const cases = [
      { name: "short-audio", source: "short-audio", baseline: true },
      { name: "long-audio", source: "long-audio", baseline: true },
      ...["ac3", "eac3", "mp3"].map((codec) => ({
        name: codec,
        source: codec,
        baseline: true,
      })),
      ...["short", "wrong", "short-full"].map((fault) => ({
        name: `range-${fault}`,
        source: "ranged",
        fault,
        baseline: true,
      })),
      { name: "aac-ts", source: "clear" },
      { name: "aac-fmp4", source: "ranged" },
      { name: "range-ignored", source: "ranged", fault: "ignored" },
      { name: "ac3-mkv", source: "ac3", container: "mkv" },
      { name: "short-audio-mkv", source: "short-audio", container: "mkv" },
      { name: "captions", source: "clear", subtitles: true },
    ];
    const types = {
      ".m3u8": "application/vnd.apple.mpegurl",
      ".ts": "video/mp2t",
      ".mp4": "video/mp4",
      ".vtt": "text/vtt",
    };
    server = http.createServer(async (request, response) => {
      try {
        const url = new URL(request.url, "http://localhost");
        const name = url.pathname.split("/")[1],
          test = cases.find((test) => test.name === name);
        assert(test);
        const file = path.resolve(
          assets,
          test.source,
          url.pathname.split("/").slice(2).join("/"),
        );
        assert(file.startsWith(assets + path.sep));
        const full = await fs.readFile(file);
        let body = full,
          status = 200;
        const entry = {
          case: active.label,
          path: url.pathname,
          range: request.headers.range,
          status: 200,
        };
        if (request.headers.range) {
          const match = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range);
          assert(match);
          const start = Number(match[1]),
            end = Number(match[2]);
          assert(end < full.length);
          body = full.subarray(start, end + 1);
          status = 206;
          response.setHeader(
            "Content-Range",
            `bytes ${start}-${end}/${full.length}`,
          );
          const target = url.pathname.includes("/video/") && start > 0;
          if (test.fault === "ignored") {
            status = 200;
            body = full;
            response.removeHeader("Content-Range");
          } else if (target && test.fault && !active.injected) {
            active.injected = true;
            entry.fault = test.fault;
            if (test.fault === "short")
              body = body.subarray(0, Math.floor(body.length / 2));
            if (test.fault === "wrong") {
              body = full.subarray(0, body.length);
              response.setHeader(
                "Content-Range",
                `bytes 0-${body.length - 1}/${full.length}`,
              );
            }
            if (test.fault === "short-full") {
              status = 200;
              body = full.subarray(0, start + Math.floor(body.length / 2));
              response.removeHeader("Content-Range");
            }
          }
        }
        entry.status = status;
        entry.bytes = body.length;
        requests.push(entry);
        response.writeHead(status, {
          "Content-Type":
            types[path.extname(file)] ?? "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        });
        response.end(body);
      } catch (error) {
        response.writeHead(404);
        response.end(String(error));
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
        "v5.5.9",
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
    const selected = process.env.E2E_INTEGRITY_CASES?.split(",");
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
          active = { label, injected: false };
          const env = {
            ...process.env,
            E2E_SKIP_BUILD: "1",
            E2E_KEEP_ARTIFACTS: "1",
            E2E_NATIVE_DOWNLOADS: "1",
            E2E_SKIP_PREVIEW: "1",
            E2E_SELECT_SUBTITLES: test.subtitles ? "1" : "0",
            E2E_OUTPUT_CONTAINER: test.container ?? "mp4",
            E2E_HLS_URL: `${base}/${test.name}/master.m3u8`,
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
          const result = browserResult(output.output),
            source = expected[test.source];
          if (test.fault && test.fault !== "ignored")
            assert(active.injected, "No invalid range response was exercised");
          if (build === "baseline" && !result.ok) {
            assert(
              /Download failed|FFmpeg|Mux|prepare.*download|Download job completed|download completion/i.test(
                result.error,
              ),
              result.error,
            );
            results.push({ browser, build, ...test, error: result.error });
          } else {
            assert.equal(result.ok, true, result.error);
            assert.equal(output.code, 0, output.output.slice(-5000));
            const extension =
              test.subtitles || test.container === "mkv" ? "mkv" : "mp4";
            const savedFile = path.join(work, `${label}.${extension}`);
            await fs.copyFile(result.downloadedFile, savedFile);
            let actual, failure;
            try {
              actual = await media(savedFile);
              assert.deepEqual(
                actual.frames,
                source.frames,
                "Saved video is incomplete or different",
              );
              assert.equal(
                actual.audioHash,
                source.audioHash,
                "Saved audio is incomplete or different",
              );
              assert.equal(
                actual.codec,
                source.codec,
                "Audio codec changed unexpectedly",
              );
              if (test.subtitles) {
                const text = await checked("ffmpeg", [
                  "-v",
                  "error",
                  "-i",
                  savedFile,
                  "-map",
                  "0:s:0",
                  "-f",
                  "webvtt",
                  "-",
                ]);
                assert.deepEqual(
                  cues(text),
                  cues(
                    await fs.readFile(
                      path.join(assets, test.source, "captions.vtt"),
                      "utf8",
                    ),
                  ),
                );
              }
            } catch (error) {
              if (
                build === "baseline" &&
                !(error instanceof MediaDecodeError) &&
                !(
                  error instanceof assert.AssertionError &&
                  /Saved (?:video|audio)|Audio codec/.test(error.message)
                )
              ) {
                throw error;
              }
              failure = error.message;
            }
            if (build === "baseline")
              assert(
                failure,
                `Old build preserved the complete media unexpectedly: ${label}`,
              );
            else {
              assert(!failure, failure);
              assert(result.browserDownload.filename.endsWith(`.${extension}`));
              assert.equal(result.browserDownload.state, "complete");
              assert.equal(
                result.downloadedContainer,
                extension === "mkv" ? "matroska" : "mp4",
              );
            }
            results.push({
              browser,
              build,
              ...test,
              savedFile,
              browserDownload: result.browserDownload,
              ...(actual
                ? {
                    videoFrames: actual.frames.length,
                    audioFrames: actual.audioFrames,
                    duration: actual.duration,
                    codec: actual.codec,
                    audioHash: actual.audioHash,
                  }
                : {}),
              ...(failure ? { error: failure } : {}),
            });
            await fs.rm(result.downloadDirectory, {
              recursive: true,
              force: true,
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
