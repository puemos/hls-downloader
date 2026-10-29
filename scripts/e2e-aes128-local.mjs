#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createCipheriv, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browsers = (process.env.E2E_AES128_BROWSERS ?? "brave,firefox").split(
  ",",
);
const primaryAudio = process.env.E2E_PRIMARY_AUDIO === "1";
const subtitleRegression = process.env.E2E_SUBTITLE_TRUNCATION === "1";
const baselineOnly = process.env.E2E_BASELINE_ONLY === "1";
const baselineVersion = subtitleRegression
  ? "v5.5.5"
  : primaryAudio
    ? "v5.5.4"
    : "v5.5.3";
const selectSubtitles =
  subtitleRegression || process.env.E2E_AES128_SUBTITLES === "1";
assert(
  !(subtitleRegression && primaryAudio),
  "Run subtitle and primary-audio regressions separately",
);

if (process.env.CI) {
  console.log("Skipping local encrypted-stream browser tests in CI.");
  process.exit(0);
}

async function run(command, args, options = {}) {
  try {
    const { stdout, stderr } = await exec(command, args, {
      cwd: root,
      timeout: 300_000,
      maxBuffer: 8 * 1024 * 1024,
      ...options,
    });
    return { code: 0, output: stdout + stderr };
  } catch (error) {
    return {
      code: error.code ?? 1,
      output: (error.stdout ?? "") + (error.stderr ?? "") + error.message,
    };
  }
}

async function checked(command, args, options) {
  const result = await run(command, args, options);
  assert.equal(result.code, 0, result.output.slice(-12_000));
  return result.output;
}

function encrypt(bytes, key, iv) {
  const cipher = createCipheriv("aes-128-cbc", key, iv);
  return Buffer.concat([cipher.update(bytes), cipher.final()]);
}

async function makeCase(assets, name, source, encryption) {
  const directory = path.join(assets, name);
  const key = randomBytes(16);
  const initKey = randomBytes(16);
  const explicitIv = Buffer.from("00000000000000000000000000000063", "hex");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "key.bin"), key);
  await fs.writeFile(path.join(directory, "init-key.bin"), initKey);

  for (const track of ["video", "audio"]) {
    const sourceDir = path.join(source, track);
    const targetDir = path.join(directory, track);
    await fs.mkdir(targetDir, { recursive: true });
    const manifest = await fs.readFile(
      path.join(sourceDir, "playlist.m3u8"),
      "utf8",
    );
    let sequence = 42n;
    const lines = [];
    let mediaKeyWritten = false;
    const mediaKey = `#EXT-X-KEY:METHOD=AES-128,URI="../key.bin"${encryption === "explicit" ? `,IV=0x${explicitIv.toString("hex")}` : ""}`;
    for (const line of manifest.split("\n")) {
      if (line.startsWith("#EXT-X-MAP:")) {
        const init = line.match(/URI="([^"]+)"/)[1];
        const bytes = await fs.readFile(path.join(sourceDir, init));
        if (encryption) {
          lines.push(
            `#EXT-X-KEY:METHOD=AES-128,URI="../init-key.bin",IV=0x${explicitIv.toString("hex")}`,
          );
        }
        await fs.writeFile(
          path.join(targetDir, init),
          encryption ? encrypt(bytes, initKey, explicitIv) : bytes,
        );
        lines.push(line);
        if (encryption) lines.push(mediaKey);
        mediaKeyWritten = true;
        continue;
      }
      const encryptedSegment =
        encryption && (encryption !== "mixed" || sequence !== 42n);
      if (line.startsWith("#EXTINF:") && encryptedSegment && !mediaKeyWritten) {
        lines.push(mediaKey);
        mediaKeyWritten = true;
      }
      if (line && !line.startsWith("#")) {
        const bytes = await fs.readFile(path.join(sourceDir, line));
        const iv = Buffer.alloc(16);
        iv.writeBigUInt64BE(sequence, 8);
        await fs.writeFile(
          path.join(targetDir, line),
          encryptedSegment
            ? encrypt(bytes, key, encryption === "explicit" ? explicitIv : iv)
            : bytes,
        );
        sequence++;
      }
      lines.push(line);
    }
    await fs.writeFile(path.join(targetDir, "playlist.m3u8"), lines.join("\n"));
  }

  await fs.writeFile(
    path.join(directory, "captions.m3u8"),
    "#EXTM3U\n#EXT-X-TARGETDURATION:8\n#EXTINF:8,\ncaptions.vtt\n#EXT-X-ENDLIST\n",
  );
  await fs.writeFile(
    path.join(directory, "captions.vtt"),
    "WEBVTT\n\n00:00:00.000 --> 00:00:08.000\nReal encrypted HLS regression test\n",
  );
  await fs.writeFile(
    path.join(directory, "master.m3u8"),
    `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="ENGLISH",LANGUAGE="en",DEFAULT=YES,AUTOSELECT=YES,URI="audio/playlist.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Text",LANGUAGE="en",URI="captions.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=960x540,CODECS="avc1.42c01f,mp4a.40.2",AUDIO="audio",SUBTITLES="subs"
video/playlist.m3u8
`,
  );
}

async function createMedia(work) {
  const reference = path.join(work, "reference.mp4");
  await checked("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=960x540:rate=25",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=1000:sample_rate=48000",
    "-t",
    "8",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-g",
    "50",
    "-sc_threshold",
    "0",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    reference,
  ]);
  const assets = path.join(work, "streams");
  for (const kind of ["ts", "fmp4"]) {
    for (const [track, map] of [
      ["video", "0:v:0"],
      ["audio", "0:a:0"],
    ]) {
      const directory = path.join(work, kind, track);
      await fs.mkdir(directory, { recursive: true });
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
        "-start_number",
        "42",
        ...(kind === "fmp4"
          ? ["-hls_segment_type", "fmp4", "-hls_fmp4_init_filename", "init.mp4"]
          : []),
        "-hls_segment_filename",
        path.join(
          directory,
          kind === "fmp4" ? "segment%d.m4s" : "segment%d.ts",
        ),
        path.join(directory, "playlist.m3u8"),
      ]);
    }
  }
  await makeCase(assets, "clear", path.join(work, "ts"));
  await makeCase(assets, "implicit", path.join(work, "ts"), "implicit");
  await makeCase(assets, "explicit", path.join(work, "ts"), "explicit");
  await makeCase(assets, "mixed", path.join(work, "ts"), "mixed");
  await makeCase(assets, "clear-cmaf", path.join(work, "fmp4"));
  await makeCase(assets, "cmaf", path.join(work, "fmp4"), "implicit");
  return { reference, assets };
}

async function serve(assets, requests) {
  const types = {
    ".m3u8": "application/vnd.apple.mpegurl",
    ".ts": "video/mp2t",
    ".mp4": "video/mp4",
    ".m4s": "video/mp4",
    ".vtt": "text/vtt",
  };
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const file = path.resolve(assets, `.${decodeURIComponent(url.pathname)}`);
      assert(file.startsWith(assets + path.sep));
      const bytes = await fs.readFile(file);
      requests.push(url.pathname);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

function browserResult(output) {
  const start = output.lastIndexOf('{\n  "ok":');
  assert(
    start >= 0,
    `Browser test did not produce a result: ${output.slice(-8000)}`,
  );
  const json = output.slice(start).trim();
  // execFile appends its command-failure message after captured stderr.
  const end = json.lastIndexOf("\n}") + 2;
  return JSON.parse(json.slice(0, end));
}

async function videoHashes(file) {
  const text = await checked("ffmpeg", [
    "-v",
    "error",
    "-i",
    file,
    "-map",
    "0:v:0",
    "-fps_mode",
    "passthrough",
    "-f",
    "framemd5",
    "-",
  ]);
  return text
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(",").at(-1).trim());
}

function subtitleCues(text) {
  const milliseconds = (timestamp) =>
    Math.round(
      timestamp
        .split(":")
        .reduce((total, part) => total * 60 + Number(part), 0) * 1000,
    );
  return text
    .replaceAll("\r\n", "\n")
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const lines = block.split("\n");
      const index = lines.findIndex((line) => line.includes(" --> "));
      if (index < 0) return [];
      const [start, end] = lines[index].split(" --> ");
      return [
        {
          start: milliseconds(start),
          end: milliseconds(end.split(/\s/)[0]),
          text: lines
            .slice(index + 1)
            .join("\n")
            .trim(),
        },
      ];
    });
}

async function validateDownload(
  result,
  referenceHashes,
  destination,
  expectedSubtitles,
) {
  await checked("ffmpeg", [
    "-v",
    "error",
    "-xerror",
    "-i",
    result.downloadedFile,
    "-map",
    "0:v:0?",
    "-map",
    "0:a:0",
    "-f",
    "null",
    "-",
  ]);
  const probe = JSON.parse(
    await checked("ffprobe", [
      "-v",
      "error",
      "-show_streams",
      "-count_frames",
      "-show_format",
      "-of",
      "json",
      result.downloadedFile,
    ]),
  );
  if (!primaryAudio)
    assert(
      probe.streams.some(
        (stream) =>
          stream.codec_type === "video" &&
          stream.width === 960 &&
          stream.height === 540,
      ),
    );
  else
    assert(
      probe.streams.every((stream) => stream.codec_type === "audio"),
      "Audio-only output contains unexpected streams",
    );
  assert(probe.streams.some((stream) => stream.codec_type === "audio"));
  if (selectSubtitles)
    assert(probe.streams.some((stream) => stream.codec_type === "subtitle"));
  for (const type of primaryAudio ? ["audio"] : ["video", "audio"]) {
    const stream = probe.streams.find((stream) => stream.codec_type === type);
    // Matroska exposes per-track duration as a tag, whereas MP4 has duration.
    const taggedDuration = stream.tags?.DURATION?.split(":").reduce(
      (total, part) => total * 60 + Number(part),
      0,
    );
    assert(
      Number(taggedDuration ?? stream.duration) >= 7.95,
      `${type} was truncated: ${taggedDuration ?? stream.duration}`,
    );
  }
  assert(
    Number(
      probe.streams.find((stream) => stream.codec_type === "audio")
        .nb_read_frames,
    ) >= 375,
    "Saved audio is missing AAC frames",
  );
  assert(
    Math.abs(Number(probe.format.duration) - 8) < 0.3,
    probe.format.duration,
  );
  const hashes = primaryAudio ? [] : await videoHashes(result.downloadedFile);
  if (!primaryAudio)
    assert.deepEqual(
      hashes,
      referenceHashes,
      "Saved video frames differ from the unencrypted reference",
    );
  const audioHash = (
    await checked("ffmpeg", [
      "-v",
      "error",
      "-i",
      result.downloadedFile,
      "-map",
      "0:a:0",
      "-f",
      "hash",
      "-hash",
      "sha256",
      "-",
    ])
  ).trim();
  let cues;
  if (expectedSubtitles !== undefined) {
    const extracted = await checked("ffmpeg", [
      "-v",
      "error",
      "-i",
      result.downloadedFile,
      "-map",
      "0:s:0",
      "-f",
      "webvtt",
      "-",
    ]);
    cues = subtitleCues(extracted);
    assert.deepEqual(
      cues,
      subtitleCues(expectedSubtitles),
      "Saved subtitle cues or timing differ from the source",
    );
  }
  await fs.copyFile(result.downloadedFile, destination);
  await fs.rm(result.downloadDirectory, { recursive: true, force: true });
  return {
    duration: probe.format.duration,
    frames: hashes.length,
    audioFrames: Number(
      probe.streams.find((stream) => stream.codec_type === "audio")
        .nb_read_frames,
    ),
    streams: probe.streams.map((stream) => stream.codec_type),
    audioHash,
    ...(cues ? { subtitleCues: cues } : {}),
    savedFile: destination,
  };
}

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "hls-aes128-real-"));
  console.log(`Evidence directory: ${work}`);
  let server;
  const results = [];
  const requests = [];
  let complete = false;
  let failure;
  try {
    console.log("Generating real H.264/AAC streams and AES-128 segments");
    const { assets, reference } = await createMedia(work);
    const captionTexts = {};
    if (subtitleRegression) {
      const short =
        "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nShort caption before the end of the media\n";
      const sparse =
        "WEBVTT\n\n00:00:00.250 --> 00:00:01.000\nFirst sparse caption\n\n00:00:06.000 --> 00:00:06.500\nLast sparse caption\n";
      for (const name of ["sparse", "empty"])
        await fs.cp(path.join(assets, "clear"), path.join(assets, name), {
          recursive: true,
        });
      for (const name of [
        "clear",
        "clear-cmaf",
        "implicit",
        "explicit",
        "mixed",
        "cmaf",
        "sparse",
        "empty",
      ]) {
        captionTexts[name] =
          name === "sparse" ? sparse : name === "empty" ? "WEBVTT\n\n" : short;
        await fs.writeFile(
          path.join(assets, name, "captions.vtt"),
          captionTexts[name],
        );
      }
    }
    if (primaryAudio) {
      for (const name of [
        "clear",
        "clear-cmaf",
        "implicit",
        "explicit",
        "mixed",
        "cmaf",
      ]) {
        await fs.writeFile(
          path.join(assets, name, "master.m3u8"),
          '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"\naudio/playlist.m3u8\n',
        );
      }
      const alternate = path.join(assets, "alternate");
      await fs.cp(path.join(assets, "clear"), alternate, { recursive: true });
      const selected = path.join(alternate, "selected");
      await fs.mkdir(selected);
      await checked("ffmpeg", [
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=500:sample_rate=48000",
        "-t",
        "8",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-hls_time",
        "2",
        "-hls_playlist_type",
        "vod",
        "-hls_segment_filename",
        path.join(selected, "segment%d.ts"),
        path.join(selected, "playlist.m3u8"),
      ]);
      await fs.writeFile(
        path.join(alternate, "master.m3u8"),
        '#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="SELECTED",LANGUAGE="en",DEFAULT=YES,URI="selected/playlist.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2",AUDIO="audio"\naudio/playlist.m3u8\n',
      );
    }
    server = await serve(assets, requests);
    const base = `http://127.0.0.1:${server.address().port}`;
    const referenceHashes = await videoHashes(reference);
    const expectedPrimaryAudio = {};
    if (primaryAudio || subtitleRegression) {
      for (const [kind, name] of [
        ["ts", "clear"],
        ["cmaf", "clear-cmaf"],
        ...(primaryAudio ? [["alternate", "alternate"]] : []),
      ]) {
        expectedPrimaryAudio[kind] = (
          await checked("ffmpeg", [
            "-v",
            "error",
            "-i",
            `${base}/${name}/${kind === "alternate" ? "selected" : "audio"}/playlist.m3u8`,
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
    }

    for (const name of [
      "clear",
      "clear-cmaf",
      "implicit",
      "explicit",
      "mixed",
      "cmaf",
      ...(primaryAudio ? ["alternate"] : []),
      ...(subtitleRegression ? ["sparse", "empty"] : []),
    ]) {
      await checked("ffmpeg", [
        "-v",
        "error",
        "-xerror",
        "-allowed_extensions",
        "ALL",
        "-i",
        `${base}/${name}/master.m3u8`,
        "-map",
        "0:v:0?",
        "-map",
        "0:a:0",
        "-f",
        "null",
        "-",
      ]);
    }
    console.log("Native FFmpeg decodes every source stream successfully");

    const baseline = path.join(work, "baseline");
    await fs.mkdir(baseline);
    await checked("gh", [
      "release",
      "download",
      baselineVersion,
      "--repo",
      "puemos/hls-downloader",
      "--pattern",
      "extension-mv3-chrome.zip",
      "--pattern",
      "extension-mv2-firefox.xpi",
      "--dir",
      baseline,
    ]);
    const baselineMv3 = path.join(baseline, "mv3");
    await checked("unzip", [
      "-q",
      path.join(baseline, "extension-mv3-chrome.zip"),
      "-d",
      baselineMv3,
    ]);
    if (!baselineOnly) {
      console.log("Building current MV2 and MV3 extensions");
      await checked("pnpm", ["run", "build:all"]);
    }

    let geckodriver = process.env.E2E_GECKODRIVER;
    if (browsers.includes("firefox") && !geckodriver) {
      const driverDir = path.join(work, "geckodriver");
      await fs.mkdir(driverDir);
      const archive = `geckodriver-v0.37.1-macos${process.arch === "arm64" ? "-aarch64" : ""}.tar.gz`;
      await checked("gh", [
        "release",
        "download",
        "v0.37.1",
        "--repo",
        "mozilla/geckodriver",
        "--pattern",
        archive,
        "--dir",
        driverDir,
      ]);
      await checked("tar", [
        "-xzf",
        path.join(driverDir, archive),
        "-C",
        driverDir,
      ]);
      geckodriver = path.join(driverDir, "geckodriver");
    }

    for (const browser of browsers) {
      assert(
        ["brave", "firefox"].includes(browser),
        `Unknown browser: ${browser}`,
      );
      const audioControls = {};
      for (const [build, name, shouldFail] of [
        [
          "baseline",
          primaryAudio || subtitleRegression ? "clear" : "implicit",
          true,
        ],
        [
          "baseline",
          primaryAudio || subtitleRegression ? "clear-cmaf" : "mixed",
          true,
        ],
        ...(primaryAudio ? [["baseline", "alternate", true]] : []),
        ["fixed", "clear", false],
        ["fixed", "clear-cmaf", false],
        ["fixed", "explicit", false],
        ["fixed", "implicit", false],
        ["fixed", "mixed", false],
        ["fixed", "cmaf", false],
        ...(primaryAudio ? [["fixed", "alternate", false]] : []),
        ...(subtitleRegression
          ? [
              ["fixed", "sparse", false],
              ["fixed", "empty", false],
            ]
          : []),
      ].filter(([build]) => !baselineOnly || build === "baseline")) {
        console.log(`${browser}: ${build} build, ${name} stream`);
        const before = requests.length;
        const firefox = browser === "firefox";
        const runner = firefox
          ? "e2e-firefox-local.mjs"
          : "e2e-local-browser.mjs";
        const env = {
          ...process.env,
          ...(geckodriver ? { E2E_GECKODRIVER: geckodriver } : {}),
          E2E_SCREENSHOT_PATH: path.join(
            work,
            `${browser}-${build}-${name}.png`,
          ),
          E2E_SKIP_BUILD: "1",
          // Preview uses hls.js, not the downloader's parser/decryptor. Its
          // handling of separately encrypted CMAF init maps is independent.
          E2E_SKIP_PREVIEW: name.includes("cmaf") ? "1" : "0",
          E2E_SELECT_SUBTITLES: selectSubtitles ? "1" : "0",
          E2E_EXTENSION_DIR:
            build === "baseline" ? baselineMv3 : path.join(root, "dist/mv3"),
          E2E_EXTENSION_XPI:
            build === "baseline"
              ? path.join(baseline, "extension-mv2-firefox.xpi")
              : path.join(root, "dist/extension-mv2-firefox.xpi"),
          E2E_HLS_URL: `${base}/${name}/master.m3u8`,
          E2E_CLEAN_DOWNLOAD: "0",
        };
        const child = await run(
          process.execPath,
          [path.join(root, "scripts", runner)],
          { env },
        );
        const result = browserResult(child.output);
        await fs.writeFile(
          path.join(work, `${browser}-${build}-${name}.json`),
          JSON.stringify(result, null, 2),
        );
        if (shouldFail) {
          if (subtitleRegression)
            assert.equal(
              child.code,
              0,
              "The old release must reproduce a saved-but-truncated file: " +
                JSON.stringify(result),
            );
          let failure = result.error;
          if (child.code === 0) {
            // A partial clear lead-in may be saved as "Completed". It still
            // must fail the same full-media validation used for fixed builds.
            await fs.copyFile(
              result.downloadedFile,
              path.join(
                work,
                `${browser}-baseline-${name}.${selectSubtitles ? "mkv" : "mp4"}`,
              ),
            );
            await assert.rejects(async () => {
              try {
                await validateDownload(
                  result,
                  referenceHashes,
                  path.join(
                    work,
                    `${browser}-baseline-${name}.${selectSubtitles ? "mkv" : "mp4"}`,
                  ),
                  captionTexts[name],
                );
              } catch (error) {
                failure = error.message;
                throw error;
              }
            }, /truncated|Saved video frames differ|Invalid data|Error while decoding/);
          } else {
            assert.match(failure ?? "", /FFmpeg exited with code 1/);
          }
          results.push({ browser, build, name, expectedFailure: failure });
          if (result.downloadDirectory)
            await fs.rm(result.downloadDirectory, {
              recursive: true,
              force: true,
            });
          console.log(`  Reproduced: ${failure}`);
        } else {
          assert.equal(child.code, 0, JSON.stringify(result));
          assert.equal(result.ok, true);
          const verified = await validateDownload(
            result,
            referenceHashes,
            path.join(
              work,
              `${browser}-${name}.${selectSubtitles ? "mkv" : "mp4"}`,
            ),
            captionTexts[name],
          );
          const kind =
            name === "alternate"
              ? "alternate"
              : name.includes("cmaf")
                ? "cmaf"
                : "ts";
          if (primaryAudio || subtitleRegression)
            assert.equal(
              verified.audioHash,
              expectedPrimaryAudio[kind],
              "Saved audio differs from the source HLS stream",
            );
          if (name.startsWith("clear"))
            audioControls[kind] = verified.audioHash;
          else if (!primaryAudio && !subtitleRegression)
            assert.equal(
              verified.audioHash,
              audioControls[kind],
              "Decoded audio differs from the unencrypted browser control",
            );
          if (["implicit", "explicit", "mixed", "cmaf"].includes(name))
            assert(
              requests
                .slice(before)
                .some((request) => request.endsWith("key.bin")),
              "No real key request was observed",
            );
          results.push({ browser, build, name, ...verified });
          console.log(
            `  Verified ${verified.frames} matching video frames, ${verified.audioFrames} complete audio frames, ${verified.duration}s`,
          );
        }
      }
    }
    complete = true;
    console.log(
      `PASS: ${results.length} browser cases. Evidence: ${work}/results.json`,
    );
  } catch (error) {
    failure = error.message;
    throw error;
  } finally {
    await fs.writeFile(
      path.join(work, "results.json"),
      JSON.stringify(
        {
          baselineVersion,
          primaryAudio,
          subtitleRegression,
          baselineOnly,
          selectSubtitles,
          complete,
          failure,
          results,
        },
        null,
        2,
      ),
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
