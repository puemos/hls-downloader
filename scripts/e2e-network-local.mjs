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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.env.CI) {
  console.log("Skipping local network-interruption browser tests in CI.");
  process.exit(0);
}
const browsers = (process.env.E2E_NETWORK_BROWSERS ?? "brave,firefox").split(
  ",",
);
assert(browsers.every((browser) => ["brave", "firefox"].includes(browser)));
const baselineOnly = process.env.E2E_BASELINE_ONLY === "1";

async function firefoxDriver(work) {
  if (process.env.E2E_GECKODRIVER) return process.env.E2E_GECKODRIVER;
  const platform =
    process.platform === "darwin"
      ? `macos${process.arch === "arm64" ? "-aarch64" : ""}`
      : process.arch === "arm64"
        ? "linux-aarch64"
        : "linux64";
  const directory = path.join(work, "geckodriver");
  await fs.mkdir(directory);
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
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-network-real-"));
  console.log(`Evidence directory: ${work}`);
  const results = [];
  const requests = [];
  let complete = false;
  let server;
  let fault;
  try {
    const { assets, reference } = await createMedia(work);
    const ranged = path.join(assets, "byte-range");
    await fs.cp(path.join(assets, "clear-cmaf"), ranged, { recursive: true });
    for (const [track, map] of [
      ["video", "0:v:0"],
      ["audio", "0:a:0"],
    ]) {
      await checked("ffmpeg", [
        "-v",
        "error",
        "-y",
        "-i",
        reference,
        "-map",
        map,
        "-c",
        "copy",
        "-hls_time",
        "2",
        "-hls_playlist_type",
        "vod",
        "-hls_segment_type",
        "fmp4",
        "-hls_flags",
        "single_file",
        "-start_number",
        "42",
        "-hls_segment_filename",
        path.join(ranged, track, "stream.mp4"),
        path.join(ranged, track, "playlist.m3u8"),
      ]);
    }
    const hashes = await videoHashes(reference);
    const baseline = path.join(work, "baseline");
    await fs.mkdir(baseline);
    for (const archive of [
      "extension-mv3-chrome.zip",
      "extension-mv2-firefox.xpi",
    ])
      await checked("gh", [
        "release",
        "download",
        "v5.5.7",
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
    const driver = browsers.includes("firefox")
      ? await firefoxDriver(work)
      : undefined;
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
        if (url.pathname === "/__control/arm" && request.method === "POST") {
          fault.stallNext = true;
          fault.stalled = undefined;
          fault.closedAt = undefined;
          response.writeHead(204);
          response.end();
          return;
        }
        if (url.pathname === "/__control/status") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              stalled: !!fault.stalled,
              closedAt: fault.closedAt,
            }),
          );
          return;
        }
        const file = path.resolve(assets, `.${url.pathname}`);
        assert(file.startsWith(assets + path.sep));
        const bytes = await fs.readFile(file);
        const entry = {
          case: fault.label,
          path: url.pathname,
          at: Date.now(),
          status: 200,
          ...(request.headers.range ? { range: request.headers.range } : {}),
        };
        requests.push(entry);
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Cache-Control", "no-store");
        if (url.pathname.endsWith(fault.target)) {
          fault.attempts++;
          fault.startedAt ??= Date.now();
          if (
            ["503", "429", "range"].includes(fault.kind) &&
            Date.now() - fault.startedAt < 1500
          ) {
            entry.status = fault.kind === "range" ? 503 : Number(fault.kind);
            response.writeHead(entry.status, { "Retry-After": "1" });
            response.end("Temporary outage");
            return;
          }
          if (
            (fault.kind === "stall" && fault.attempts === 1) ||
            (fault.kind === "cancel" && fault.stallNext)
          ) {
            fault.stallNext = false;
            entry.status = "stalled-body";
            response.writeHead(200, {
              "Content-Type": types[path.extname(file)],
              "Content-Length": bytes.length,
            });
            response.write(bytes.subarray(0, 16));
            fault.stalled = response;
            const activeFault = fault;
            response.once("close", () => {
              activeFault.closedAt = Date.now();
            });
            // Simulate a connection that never resumes after connectivity returns.
            fault.restoreTimer = setTimeout(() => {
              fault.restoredAt = Date.now();
            }, 1500);
            return;
          }
          if (fault.attempts <= 2 && fault.kind === "disconnect") {
            entry.status = "connection-reset";
            response.destroy();
            return;
          }
          if (fault.kind === "slow") {
            entry.status = "slow-body";
            response.writeHead(200, {
              "Content-Type": types[path.extname(file)],
              "Content-Length": bytes.length,
            });
            const active = fault;
            let offset = 0;
            const send = () => {
              const next = Math.min(
                bytes.length,
                offset + Math.ceil(bytes.length / 4),
              );
              response.write(bytes.subarray(offset, next));
              offset = next;
              if (offset === bytes.length) {
                clearInterval(active.slowTimer);
                active.recoveredAt = Date.now();
                response.end();
              }
            };
            send();
            active.slowTimer = setInterval(send, 12_000);
            response.once("close", () => clearInterval(active.slowTimer));
            return;
          }
          fault.recoveredAt ??= Date.now();
        }
        let payload = bytes;
        if (request.headers.range) {
          const match = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range);
          assert(match, "Invalid byte range");
          const start = Number(match[1]),
            end = Number(match[2]);
          assert(start <= end && end < bytes.length);
          payload = bytes.subarray(start, end + 1);
          response.setHeader(
            "Content-Range",
            `bytes ${start}-${end}/${bytes.length}`,
          );
          entry.status = 206;
        }
        response.writeHead(entry.status, {
          "Content-Type":
            types[path.extname(file)] ?? "application/octet-stream",
        });
        response.end(payload);
      } catch (error) {
        response.writeHead(404);
        response.end(String(error));
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const cases = [
      { kind: "range", source: "byte-range", target: "/video/stream.mp4" },
      { kind: "slow", source: "clear", target: "/video/segment43.ts" },
      { kind: "503", source: "clear", target: "/video/segment43.ts" },
      { kind: "stall", source: "clear", target: "/video/segment43.ts" },
      { kind: "429", source: "clear-cmaf", target: "/audio/segment43.m4s" },
      { kind: "disconnect", source: "cmaf", target: "/video/segment43.m4s" },
      { kind: "503", source: "implicit", target: "/key.bin", subtitles: true },
      {
        kind: "cancel",
        source: "clear",
        target: "/video/segment43.ts",
        flow: "cancel-retry",
      },
      {
        kind: "storage",
        source: "clear",
        target: "/unused",
        flow: "storage-retry",
      },
    ];
    const selected = process.env.E2E_NETWORK_CASES?.split(",");
    const included = cases.filter(
      (test) => !selected || selected.includes(test.kind),
    );
    const matrix = [];
    for (const browser of browsers) {
      for (const test of included.filter(
        (test) =>
          process.env.E2E_SKIP_BASELINE !== "1" &&
          ["503", "stall", "cancel", "storage"].includes(test.kind) &&
          !test.subtitles,
      ))
        matrix.push({ browser, build: "baseline", ...test });
      if (!baselineOnly)
        for (const test of included)
          matrix.push({ browser, build: "fixed", ...test });
    }
    for (const test of matrix) {
      const label = `${test.browser}-${test.build}-${test.source}-${test.kind}${test.subtitles ? "-subtitles" : ""}`;
      console.log(label);
      fault = { ...test, label, attempts: 0, stallNext: true };
      const env = {
        ...process.env,
        E2E_SKIP_BUILD: "1",
        E2E_NATIVE_DOWNLOADS: "1",
        E2E_KEEP_ARTIFACTS: "1",
        E2E_SKIP_PREVIEW: "1",
        E2E_SELECT_SUBTITLES: test.subtitles ? "1" : "0",
        E2E_HLS_URL: `${base}/${test.source}/master.m3u8`,
        E2E_CONTROL_URL: `${base}/__control/status`,
        ...(test.flow ? { E2E_JOB_FLOW: test.flow } : {}),
        E2E_JOB_TIMEOUT_MS: test.build === "baseline" ? "45000" : "120000",
        E2E_EXTENSION_DIR:
          test.build === "baseline"
            ? path.join(baseline, "mv3")
            : path.join(root, "dist/mv3"),
        E2E_EXTENSION_XPI:
          test.build === "baseline"
            ? path.join(baseline, "extension-mv2-firefox.xpi")
            : path.join(root, "dist/extension-mv2-firefox.xpi"),
        ...(driver ? { E2E_GECKODRIVER: driver } : {}),
      };
      const started = Date.now();
      const output = await run(
        process.execPath,
        [
          test.browser === "firefox"
            ? "scripts/e2e-firefox-local.mjs"
            : "scripts/e2e-local-browser.mjs",
        ],
        { env },
      );
      await fs.writeFile(path.join(work, `${label}.log`), output.output);
      const result = browserResult(output.output);
      if (test.build === "baseline") {
        assert.equal(
          result.ok,
          false,
          `Baseline unexpectedly recovered: ${label}`,
        );
        assert(
          test.kind === "storage"
            ? result.error.includes(
                "without a recoverable job error (injected=1)",
              )
            : test.kind === "cancel"
              ? result.error.includes("Cancelled request remained open")
              : test.kind === "503"
                ? result.error.includes("HTTP 503")
                : /Timed out waiting for .*complet/i.test(result.error),
          result.error,
        );
        assert(
          !fault.recoveredAt,
          "The old build recovered the interrupted request",
        );
        if (test.kind === "stall")
          assert.equal(
            fault.attempts,
            1,
            "The old build retried the stalled response",
          );
        assert.equal(
          (await fs.readdir(result.downloadDirectory)).length,
          0,
          "The old build saved an incomplete file",
        );
        results.push({
          ...test,
          error: result.error,
          attempts: fault.attempts,
        });
      } else {
        assert.equal(output.code, 0, output.output.slice(-8000));
        assert.equal(result.ok, true, result.error);
        if (test.kind !== "storage") {
          if (test.kind === "slow") {
            assert.equal(
              fault.attempts,
              1,
              "Slow active media was retried unnecessarily",
            );
            assert(fault.recoveredAt - fault.startedAt >= 35_000);
          } else assert(fault.attempts > 1, "No interruption was exercised");
          assert(fault.recoveredAt, "Interrupted resource was never recovered");
        }
        if (test.flow)
          assert(result.flowEvidence, "Missing lifecycle verification");
        if (test.kind === "cancel")
          assert.equal(result.flowEvidence.cancelledRequests, 6);
        if (test.kind === "range")
          assert(
            requests.some(
              (entry) =>
                entry.case === label && entry.range && entry.status === 206,
            ),
            "No byte-range media was transferred",
          );
        const extension = test.subtitles ? "mkv" : "mp4";
        assert.equal(
          result.downloadedContainer,
          test.subtitles ? "matroska" : "mp4",
        );
        assert.equal(
          path.basename(result.browserDownload.filename),
          `master.${extension}`,
        );
        assert.equal(result.browserDownload.state, "complete");
        const saved = await validateDownload(
          result,
          hashes,
          path.join(work, `${label}.${extension}`),
          test.subtitles
            ? await fs.readFile(
                path.join(assets, test.source, "captions.vtt"),
                "utf8",
              )
            : undefined,
          { includeSubtitles: !!test.subtitles },
        );
        const expectedAudio = (
          await checked("ffmpeg", [
            "-v",
            "error",
            "-i",
            path.join(assets, "clear/audio/playlist.m3u8"),
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
          "Saved audio differs from the source",
        );
        results.push({
          ...test,
          ...saved,
          browserVersion: result.browser,
          savedName: path.basename(result.browserDownload.filename),
          attempts: fault.attempts,
          elapsedMs: Date.now() - started,
          recoveryMs: fault.recoveredAt - fault.startedAt,
          ...(result.flowEvidence ? { flowEvidence: result.flowEvidence } : {}),
        });
      }
      clearTimeout(fault.restoreTimer);
      clearInterval(fault.slowTimer);
      fault.stalled?.destroy();
      console.log(`PASS ${label} (${fault.attempts} resource attempts)`);
    }
    complete = true;
  } finally {
    clearTimeout(fault?.restoreTimer);
    clearInterval(fault?.slowTimer);
    fault?.stalled?.destroy();
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
