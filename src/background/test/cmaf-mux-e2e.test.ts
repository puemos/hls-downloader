import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  FFmpegHostAdapter,
  ffprobe,
  isFFmpegAvailable,
} from "./helpers/ffmpeg-host-adapter";

vi.mock("@ffmpeg/ffmpeg", () => ({ FFmpeg: class {} }));

import { writeMediaToFFmpegFS, muxExec } from "../src/services/ffmpeg-muxer";

const ffmpegAvailable = isFFmpegAvailable();
const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "ffmpeg";
const FIXTURES_DIR = path.join(__dirname, "fixtures");
const E2E_OUTPUT_DIR = path.join(__dirname, "fixtures", "e2e-output");

function loadFixture(name: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(FIXTURES_DIR, name)));
}

async function saveOutput(blob: Blob, name: string): Promise<string> {
  const outputFile = path.join(E2E_OUTPUT_DIR, name);
  fs.writeFileSync(outputFile, new Uint8Array(await blob.arrayBuffer()));
  return outputFile;
}

/** Remux a TS fixture to fragmented MP4 using host ffmpeg */
function remuxToFmp4(tsData: Uint8Array, tmpPath: string): Uint8Array {
  const tsPath = `${tmpPath}.ts`;
  const mp4Path = `${tmpPath}.mp4`;
  fs.writeFileSync(tsPath, tsData);
  execFileSync(FFMPEG_PATH, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    tsPath,
    "-c",
    "copy",
    "-bsf:a",
    "aac_adtstoasc",
    "-movflags",
    "+frag_keyframe+empty_moov",
    "-f",
    "mp4",
    mp4Path,
  ]);
  const result = new Uint8Array(fs.readFileSync(mp4Path));
  fs.unlinkSync(tsPath);
  fs.unlinkSync(mp4Path);
  return result;
}

describe.skipIf(!ffmpegAvailable)("CMAF Mux Pipeline E2E (host ffmpeg)", () => {
  let adapter: FFmpegHostAdapter;
  let fmp4Video: Uint8Array;
  let fmp4Audio: Uint8Array;

  beforeAll(() => {
    fs.mkdirSync(E2E_OUTPUT_DIR, { recursive: true });

    // Generate fMP4 fixtures from existing TS fixtures
    const tmpBase = path.join(E2E_OUTPUT_DIR, "_tmp_fmp4");
    fmp4Video = remuxToFmp4(loadFixture("video-only.ts"), `${tmpBase}_video`);
    fmp4Audio = remuxToFmp4(loadFixture("audio-only.ts"), `${tmpBase}_audio`);
  });

  beforeEach(async () => {
    adapter = await FFmpegHostAdapter.create();
  });

  afterEach(async () => {
    await adapter.cleanup();
  });

  it("fMP4 video + fMP4 audio → valid MP4 output", async () => {
    await writeMediaToFFmpegFS(adapter as any, "video.mp4", fmp4Video);
    await writeMediaToFFmpegFS(adapter as any, "audio.mp4", fmp4Audio);

    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
      videoFileName: "video.mp4",
      audioFileName: "audio.mp4",
    });

    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.mime).toBe("video/mp4");

    const out = await saveOutput(result.blob, "cmaf-01-fmp4-va.mp4");
    expect(await ffprobe(out)).toMatchSnapshot();
  }, 30_000);

  it("fMP4 video-only → valid output", async () => {
    await writeMediaToFFmpegFS(adapter as any, "video.mp4", fmp4Video);

    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
      videoFileName: "video.mp4",
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "cmaf-02-fmp4-video-only.mp4");
    expect(await ffprobe(out)).toMatchSnapshot();
  }, 30_000);

  it("no aac_adtstoasc in fMP4 path (would cause warning with real ffmpeg)", async () => {
    await writeMediaToFFmpegFS(adapter as any, "video.mp4", fmp4Video);
    await writeMediaToFFmpegFS(adapter as any, "audio.mp4", fmp4Audio);

    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
      videoFileName: "video.mp4",
      audioFileName: "audio.mp4",
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "cmaf-03-fmp4-va.mp4");
    const probe = await ffprobe(out);

    // Should have both video and audio streams
    expect(probe.streams.some((s) => s.codec_type === "video")).toBe(true);
    expect(probe.streams.some((s) => s.codec_type === "audio")).toBe(true);
  }, 30_000);
});
