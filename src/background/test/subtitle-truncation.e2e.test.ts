import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {
  FFmpegHostAdapter,
  ffprobe,
  isFFmpegAvailable,
} from "./helpers/ffmpeg-host-adapter";
import { muxExec, writeMediaToFFmpegFS } from "../src/services/ffmpeg-muxer";

const fixtures = path.join(__dirname, "fixtures");

function decodedHash(file: string, track: "v" | "a"): string {
  return execFileSync(
    process.env.FFMPEG_PATH ?? "ffmpeg",
    [
      "-v",
      "error",
      "-xerror",
      "-i",
      file,
      "-map",
      `0:${track}:0`,
      ...(track === "v" ? ["-fps_mode", "passthrough"] : []),
      "-f",
      "hash",
      "-hash",
      "sha256",
      "-",
    ],
    { encoding: "utf8" },
  ).trim();
}

describe.skipIf(!isFFmpegAvailable())(
  "WebVTT exports preserve complete media (host ffmpeg)",
  () => {
    let adapter: FFmpegHostAdapter;
    let videoHash: string;
    let audioHash: string;

    beforeAll(() => {
      videoHash = decodedHash(path.join(fixtures, "video-only.ts"), "v");
      audioHash = decodedHash(path.join(fixtures, "audio-only.ts"), "a");
    });

    beforeEach(async () => {
      adapter = await FFmpegHostAdapter.create();
      await writeMediaToFFmpegFS(
        adapter as any,
        "video.ts",
        new Uint8Array(await fs.readFile(path.join(fixtures, "video-only.ts"))),
      );
      await writeMediaToFFmpegFS(
        adapter as any,
        "audio.ts",
        new Uint8Array(await fs.readFile(path.join(fixtures, "audio-only.ts"))),
      );
    });

    afterEach(async () => {
      await adapter.cleanup();
    });

    it.each([
      ["short", "WEBVTT\n\n00:00:00.000 --> 00:00:00.500\nEarly caption\n"],
      [
        "sparse",
        "WEBVTT\n\n00:00:00.250 --> 00:00:00.500\nFirst\n\n00:00:02.250 --> 00:00:02.500\nLast\n",
      ],
      [
        "full",
        "WEBVTT\n\n00:00:00.000 --> 00:00:04.100\nCaption across the media\n",
      ],
      ["empty", "WEBVTT\n\n"],
    ])(
      "keeps every decoded video frame and audio sample with %s captions",
      async (_, subtitleText) => {
        // These fixtures deliberately have different lengths: 3s video and 4s audio.
        // Neither the subtitles nor the shorter video may truncate the audio.
        const result = await muxExec({
          ffmpeg: adapter as any,
          outputFileName: "output.mkv",
          hasVideo: true,
          hasAudio: true,
          subtitleText,
          subtitleLanguage: "en",
        });
        const file = path.join(adapter.tempDir, "verified.mkv");
        await fs.writeFile(
          file,
          new Uint8Array(await result.blob.arrayBuffer()),
        );
        const probe = await ffprobe(file);
        expect(probe.streams.map((stream) => stream.codec_type)).toEqual([
          "video",
          "audio",
          "subtitle",
        ]);
        expect(probe.streams[2].codec_name).toBe("webvtt");
        expect(decodedHash(file, "v")).toBe(videoHash);
        expect(decodedHash(file, "a")).toBe(audioHash);
      },
      30_000,
    );
  },
);
