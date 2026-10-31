#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checked, createMedia, videoHashes } from "./e2e-aes128-local.mjs";
import {
  CdpClient,
  evaluate,
  waitFor,
  clickButton,
  clickButtonByAriaLabel,
  clickTab,
  writeDownloadPreferences,
  reservePort,
  getBravePath,
  stopChild,
  sessionExceptions,
} from "./e2e-local-browser.mjs";

if (process.env.CI) process.exit(0);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-bulk-real-"));
console.log(`Evidence directory: ${work}`);
const screenshots = path.join(work, "screenshots");
await fs.mkdir(screenshots);
const downloads = path.join(work, "downloads");
await fs.mkdir(downloads);
const profile = path.join(work, "profile");
const extensionDir = path.resolve(
  root,
  process.env.E2E_EXTENSION_DIR ?? "dist/mv3",
);
let cdp, child, server;
const requests = [],
  results = [],
  active = new Map();
let peakActiveJobs = 0;

try {
  const { assets, reference } = await createMedia(work);
  const low = path.join(assets, "low-video");
  await fs.mkdir(low);
  const lowReference = path.join(work, "low-reference.mp4");
  await checked("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    reference,
    "-an",
    "-vf",
    "scale=640:360",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-g",
    "50",
    "-sc_threshold",
    "0",
    lowReference,
  ]);
  await checked("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    lowReference,
    "-c",
    "copy",
    "-hls_time",
    "2",
    "-hls_playlist_type",
    "vod",
    path.join(low, "playlist.m3u8"),
  ]);
  for (const kind of ["clear", "cmaf"]) {
    const file = path.join(assets, kind, "master.m3u8");
    const master = await fs.readFile(file, "utf8");
    await fs.writeFile(
      file,
      master +
        '#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360,CODECS="avc1.42c01f,mp4a.40.2",AUDIO="audio"\n/low-video/playlist.m3u8\n',
    );
  }
  const names = {
    clear: "Field Notes · Episode 01",
    cmaf: "Field Notes · Episode 02",
    unavailable: "Field Notes · Episode 03",
  };
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    requests.push(url.pathname);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    };
    try {
      if (url.pathname.startsWith("/page/")) {
        const name = url.pathname.split("/").at(-1);
        res.writeHead(200, {
          ...headers,
          "Content-Type": "text/html; charset=utf-8",
        });
        res.end(
          `<!doctype html><title>${names[name]}</title><script>setTimeout(()=>fetch('/${name}/master.m3u8'),300)</script>`,
        );
        return;
      }
      if (url.pathname === "/unavailable/master.m3u8") {
        res.writeHead(200, {
          ...headers,
          "Content-Type": "application/vnd.apple.mpegurl",
        });
        res.end(
          "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=960x540\nempty.m3u8\n",
        );
        return;
      }
      if (url.pathname === "/unavailable/empty.m3u8") {
        res.writeHead(200, {
          ...headers,
          "Content-Type": "application/vnd.apple.mpegurl",
        });
        res.end("#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-ENDLIST\n");
        return;
      }
      const file = path.resolve(assets, `.${url.pathname}`);
      assert(file.startsWith(assets + path.sep));
      const bytes = await fs.readFile(file);
      const type =
        {
          ".m3u8": "application/vnd.apple.mpegurl",
          ".ts": "video/mp2t",
          ".m4s": "video/mp4",
          ".mp4": "video/mp4",
        }[path.extname(file)] ?? "application/octet-stream";
      if (/\.(ts|m4s)$/.test(file)) {
        const key = url.pathname.split("/")[1];
        active.set(key, (active.get(key) ?? 0) + 1);
        peakActiveJobs = Math.max(peakActiveJobs, active.size);
        res.once("finish", () => {
          const count = active.get(key) - 1;
          if (count) active.set(key, count);
          else active.delete(key);
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      res.writeHead(200, { ...headers, "Content-Type": type });
      res.end(bytes);
    } catch {
      res.writeHead(404, headers);
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await writeDownloadPreferences(profile, downloads);
  const debugPort = await reservePort();
  child = spawn(
    getBravePath(),
    [
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${debugPort}`,
      `--load-extension=${extensionDir}`,
      "--enable-unsafe-extension-debugging",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const version = await waitFor("browser", async () => {
    try {
      return await (
        await fetch(`http://127.0.0.1:${debugPort}/json/version`)
      ).json();
    } catch {
      return null;
    }
  });
  cdp = await CdpClient.connect(version.webSocketDebuggerUrl);
  await cdp.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloads,
  });
  const background = await waitFor("extension", async () =>
    (await cdp.send("Target.getTargets")).targetInfos.find(
      (t) => t.type === "service_worker" && t.url.endsWith("/background.js"),
    ),
  );
  const extensionId = new URL(background.url).host;
  const bg = (
    await cdp.send("Target.attachToTarget", {
      targetId: background.targetId,
      flatten: true,
    })
  ).sessionId;
  await cdp.send("Runtime.enable", {}, bg);
  await waitFor("capture listener", () =>
    evaluate(cdp, bg, "chrome.webRequest.onCompleted.hasListeners()"),
  );
  for (const name of Object.keys(names)) {
    await cdp.send("Target.createTarget", { url: `${origin}/page/${name}` });
    // Keep the capture order deterministic and allow tab titles to load.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  const target = await cdp.send("Target.createTarget", {
    url: `chrome-extension://${extensionId}/popup.html`,
  });
  const popup = (
    await cdp.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: true,
    })
  ).sessionId;
  await cdp.send("Runtime.enable", {}, popup);
  await cdp.send("Page.enable", {}, popup);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 500, height: 600, deviceScaleFactor: 2, mobile: false },
    popup,
  );
  await waitFor("three real captured streams", () =>
    evaluate(
      cdp,
      popup,
      'document.querySelectorAll("[data-playlist-row]").length === 3',
    ),
  );
  await clickTab(cdp, popup, "Settings");
  await clickButton(cdp, popup, "Set limit");
  await clickTab(cdp, popup, "Capture");

  // Remember captions for one playlist through the normal selection UI.
  await clickButtonByAriaLabel(cdp, popup, `Choose quality for ${names.cmaf}`);
  await waitFor("subtitle choices", () =>
    evaluate(
      cdp,
      popup,
      "document.querySelector('select[aria-label=\"Subtitles\"]')?.options.length > 1",
    ),
  );
  await evaluate(
    cdp,
    popup,
    `(() => { const s = document.querySelector('select[aria-label="Subtitles"]'); s.value=s.options[1].value; s.dispatchEvent(new Event('change',{bubbles:true})); })()`,
  );
  await clickButtonByAriaLabel(cdp, popup, "All streams");

  async function screenshot(name) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const { data } = await cdp.send(
      "Page.captureScreenshot",
      {
        format: "png",
        clip: { x: 0, y: 0, width: 500, height: 600, scale: 1 },
      },
      popup,
    );
    const file = path.join(screenshots, `${name}.png`);
    await fs.writeFile(file, Buffer.from(data, "base64"));
    return file;
  }
  async function quality(value) {
    await evaluate(
      cdp,
      popup,
      `(() => {const s = document.querySelector('[aria-label="Bulk video quality"]');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await waitFor("stream checks", () =>
      evaluate(
        cdp,
        popup,
        '!document.body.innerText.includes("Checking stream")',
      ),
    );
  }
  async function verify(file, height) {
    await checked("ffmpeg", [
      "-v",
      "error",
      "-xerror",
      "-i",
      file,
      "-map",
      "0:v",
      "-map",
      "0:a",
      "-f",
      "null",
      "-",
    ]);
    const probe = JSON.parse(
      await checked("ffprobe", [
        "-v",
        "error",
        "-count_frames",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        file,
      ]),
    );
    const video = probe.streams.find((s) => s.codec_type === "video"),
      audio = probe.streams.find((s) => s.codec_type === "audio");
    assert.equal(video.height, height);
    assert.equal(Number(video.nb_read_frames), 200);
    const audioDuration =
      audio.duration ??
      audio.tags?.DURATION?.split(":").reduce(
        (total, part) => total * 60 + Number(part),
        0,
      );
    assert(
      Number(audioDuration) >= 7.95 && Number(audio.nb_read_frames) >= 375,
      "Audio is truncated",
    );
    assert(Math.abs(Number(probe.format.duration) - 8) < 0.3);
    assert.deepEqual(
      await videoHashes(file),
      await videoHashes(height === 540 ? reference : lowReference),
    );
    const subtitles = probe.streams.some((s) => s.codec_type === "subtitle");
    const source = path.join(
      assets,
      subtitles ? "clear-cmaf" : "clear",
      "audio/playlist.m3u8",
    );
    const pcmHash = (input) =>
      checked("ffmpeg", [
        "-v",
        "error",
        "-i",
        input,
        "-map",
        "0:a:0",
        "-f",
        "hash",
        "-hash",
        "sha256",
        "-",
      ]);
    assert.equal(
      await pcmHash(file),
      await pcmHash(source),
      "Saved audio differs from its complete source",
    );
    if (subtitles) {
      const captions = await checked("ffmpeg", [
        "-v",
        "error",
        "-i",
        file,
        "-map",
        "0:s:0",
        "-f",
        "webvtt",
        "-",
      ]);
      assert(captions.includes("00:00.000 --> 00:08.000"));
      assert(captions.includes("Real encrypted HLS regression test"));
      assert(probe.format.format_name.includes("matroska"));
    }
    return {
      file,
      height,
      videoFrames: 200,
      audioFrames: Number(audio.nb_read_frames),
      duration: probe.format.duration,
      subtitles,
    };
  }

  const shots = {};
  for (const cap of ["best", "480"]) {
    await clickButton(cdp, popup, "Select");
    await clickButton(cdp, popup, "Select visible");
    if (cap === "best") shots.selection = await screenshot("bulk-selection");
    await clickButton(cdp, popup, "Review 3 streams");
    await quality(cap);
    const text = await evaluate(cdp, popup, "document.body.innerText");
    assert(
      text.includes(cap === "best" ? "Queue 3 downloads" : "Queue 2 downloads"),
      text,
    );
    if (cap === "best") {
      assert(
        text.includes("en subtitles · MKV"),
        "Saved subtitles were not included in review",
      );
      await waitFor("quality focus", () =>
        evaluate(
          cdp,
          popup,
          'document.activeElement?.getAttribute("aria-label") === "Bulk video quality"',
        ),
      );
      await cdp.send(
        "Input.dispatchKeyEvent",
        { type: "keyDown", key: "Escape", code: "Escape" },
        popup,
      );
      await cdp.send(
        "Input.dispatchKeyEvent",
        { type: "keyUp", key: "Escape", code: "Escape" },
        popup,
      );
      await waitFor("review closed with selection preserved", () =>
        evaluate(
          cdp,
          popup,
          '!document.querySelector(\'[role="dialog"][aria-hidden="false"]\') && document.body.innerText.includes("3 selected")',
        ),
      );
      await clickButton(cdp, popup, "Review 3 streams");
      await quality(cap);
      shots.review = await screenshot("bulk-review");
    } else {
      assert(text.includes("No video quality at or below 480p"));
      shots.capped = await screenshot("bulk-quality-cap");
    }
    const beforeFiles = new Set(await fs.readdir(downloads));
    const before = beforeFiles.size;
    peakActiveJobs = 0;
    await clickButton(
      cdp,
      popup,
      cap === "best" ? "Queue 3 downloads" : "Queue 2 downloads",
    );
    await waitFor(
      "two complete saved files",
      async () => {
        const files = await fs.readdir(downloads);
        return (
          files.length === before + 2 &&
          files.every((f) => !f.endsWith(".crdownload"))
        );
      },
      { timeoutMs: 180000, intervalMs: 500 },
    );
    const all = await evaluate(
      cdp,
      bg,
      'chrome.downloads.search({}).then(items=>items.filter(i=>i.state==="complete").map(i=>i.filename))',
      { awaitPromise: true },
    );
    assert.equal(all.length, before + 2);
    const newFiles = (await fs.readdir(downloads)).filter(
      (file) => !beforeFiles.has(file),
    );
    for (const file of newFiles)
      results.push(
        await verify(path.join(downloads, file), cap === "best" ? 540 : 360),
      );
    if (cap === "best") {
      assert.equal(peakActiveJobs, 1, "The active download limit was exceeded");
      const body = await evaluate(cdp, popup, "document.body.innerText");
      assert(
        body.includes("Error"),
        "Preparation failure should remain visible alongside successful downloads",
      );
      shots.downloads = await screenshot("bulk-downloads");
    }
    await clickTab(cdp, popup, "Capture");
  }
  // At one active job, the independent high-quality streams must not overlap.
  // Low-quality jobs share a common /low-video path, so only high-quality requests
  // can identify job ownership independently; their normal audio requests still
  // ensure both tracks were fetched.
  assert(
    peakActiveJobs <= 2,
    `Unexpected overlapping media sources: ${peakActiveJobs}`,
  );
  assert.equal(sessionExceptions(cdp, popup).length, 0);
  assert.equal(sessionExceptions(cdp, bg).length, 0);
  assert.equal(
    results.filter((result) => result.subtitles).length,
    2,
    "Each batch should retain the selected MKV subtitle track",
  );
  await fs.writeFile(
    path.join(work, "results.json"),
    JSON.stringify(
      {
        browser: version.Browser,
        screenshots: shots,
        results,
        requests,
        peakActiveJobs,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      { ok: true, work, screenshots: shots, results, peakActiveJobs },
      null,
      2,
    ),
  );
} finally {
  cdp?.close();
  await stopChild(child);
  if (server) await new Promise((resolve) => server.close(resolve));
  await fs.rm(profile, { recursive: true, force: true });
}
