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
import {
  FFmpegHostAdapter,
  ffprobe,
  isFFmpegAvailable,
} from "./helpers/ffmpeg-host-adapter";

vi.mock("@ffmpeg/ffmpeg", () => ({ FFmpeg: class {} }));

import { writeMediaToFFmpegFS, muxExec } from "../src/services/ffmpeg-muxer";

const ffmpegAvailable = isFFmpegAvailable();
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

describe.skipIf(!ffmpegAvailable)("Mux Pipeline E2E (host ffmpeg)", () => {
  let adapter: FFmpegHostAdapter;

  beforeAll(() => {
    fs.mkdirSync(E2E_OUTPUT_DIR, { recursive: true });
  });

  beforeEach(async () => {
    adapter = await FFmpegHostAdapter.create();
  });

  afterEach(async () => {
    await adapter.cleanup();
  });

  it("concat 2 muxed v+a segments → MP4", async () => {
    const seg1 = loadFixture("video-audio-muxed.ts");
    const seg2 = loadFixture("video-audio-seg2.ts");
    const combined = new Uint8Array(seg1.byteLength + seg2.byteLength);
    combined.set(seg1, 0);
    combined.set(seg2, seg1.byteLength);

    await writeMediaToFFmpegFS(adapter as any, "video.ts", combined);
    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });

    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.mime).toBe("video/mp4");

    const out = await saveOutput(result.blob, "01-concat-muxed.mp4");
    expect(await ffprobe(out)).toMatchSnapshot();
  }, 30_000);

  it("concatf chunk list input → MP4 without pre-concatenating in JS", async () => {
    const seg1 = loadFixture("video-audio-muxed.ts");
    const seg2 = loadFixture("video-audio-seg2.ts");

    await writeMediaToFFmpegFS(adapter as any, "video-000000.ts", seg1);
    await writeMediaToFFmpegFS(adapter as any, "video-000001.ts", seg2);
    await writeMediaToFFmpegFS(
      adapter as any,
      "video.concat.txt",
      new TextEncoder().encode("video-000000.ts\nvideo-000001.ts\n")
    );

    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
      videoFileName: "concatf:video.concat.txt",
      videoContainer: "mpegts",
      cleanupFileNames: [
        "video.concat.txt",
        "video-000000.ts",
        "video-000001.ts",
      ],
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "01b-concatf-muxed.mp4");
    const probe = await ffprobe(out);
    expect(probe.streams.some((stream) => stream.codec_type === "video")).toBe(
      true
    );
    expect(probe.streams.some((stream) => stream.codec_type === "audio")).toBe(
      true
    );
  }, 30_000);

  it("separate video + audio → MP4", async () => {
    await writeMediaToFFmpegFS(
      adapter as any,
      "video.ts",
      loadFixture("video-only.ts")
    );
    await writeMediaToFFmpegFS(
      adapter as any,
      "audio.ts",
      loadFixture("audio-only.ts")
    );
    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "02-separate-va.mp4");
    expect(await ffprobe(out)).toMatchSnapshot();
  }, 30_000);

  it("selected audio input with no audio stream still saves video", async () => {
    await writeMediaToFFmpegFS(
      adapter as any,
      "video.ts",
      loadFixture("video-only.ts")
    );
    await writeMediaToFFmpegFS(
      adapter as any,
      "audio.ts",
      loadFixture("video-only.ts")
    );

    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "02b-audio-map-optional.mp4");
    const probe = await ffprobe(out);
    expect(probe.streams.some((stream) => stream.codec_type === "video")).toBe(
      true
    );
  }, 30_000);

  it("muxed-with-data-stream → MP4, no data streams (#509)", async () => {
    await writeMediaToFFmpegFS(
      adapter as any,
      "video.ts",
      loadFixture("muxed-with-data-stream.ts")
    );
    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "03-data-stream-filtered.mp4");
    expect(await ffprobe(out)).toMatchSnapshot();
  }, 30_000);

  it("audio-only → AAC MP4", async () => {
    await writeMediaToFFmpegFS(
      adapter as any,
      "audio.ts",
      loadFixture("audio-only.ts")
    );
    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mp4",
      hasVideo: false,
      hasAudio: true,
    });

    expect(result.blob.size).toBeGreaterThan(0);

    const out = await saveOutput(result.blob, "04-audio-only.mp4");
    expect(await ffprobe(out)).toMatchSnapshot();
  }, 30_000);

  it("video + subtitles → MKV", async () => {
    await writeMediaToFFmpegFS(
      adapter as any,
      "video.ts",
      loadFixture("video-only.ts")
    );
    const result = await muxExec({
      ffmpeg: adapter as any,
      outputFileName: "output.mkv",
      hasVideo: true,
      hasAudio: false,
      subtitleText:
        "WEBVTT\n\n00:00:00.000 --> 00:00:01.500\nHello from E2E test!\n\n00:00:01.500 --> 00:00:03.000\nSubtitle line two.\n",
      subtitleLanguage: "en",
    });

    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.mime).toBe("video/x-matroska");

    const out = await saveOutput(result.blob, "05-with-subtitles.mkv");
    // MKV embeds a muxing timestamp, making sha256 non-deterministic across runs
    const { sha256: _, ...probe } = await ffprobe(out);
    expect(probe).toMatchSnapshot();
  }, 30_000);

  it("garbage input → rejects", async () => {
    await writeMediaToFFmpegFS(
      adapter as any,
      "video.ts",
      new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
    );
    await expect(
      muxExec({
        ffmpeg: adapter as any,
        outputFileName: "output.mp4",
        hasVideo: true,
        hasAudio: false,
      })
    ).rejects.toThrow("FFmpeg exited with code");
  }, 30_000);
});
