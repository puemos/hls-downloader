import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { muxExec } from "../src/services/ffmpeg-muxer";
import {
  FFmpegHostAdapter,
  ffprobe,
  isFFmpegAvailable,
} from "./helpers/ffmpeg-host-adapter";

const directories: string[] = [];
const ffmpeg = (args: string[]) =>
  execFileSync(
    process.env.FFMPEG_PATH ?? "ffmpeg",
    ["-v", "error", "-nostdin", ...args],
    { encoding: "utf8" },
  );
const hash = (file: string, type: "v" | "a") =>
  ffmpeg([
    "-i",
    file,
    "-map",
    `0:${type}:0`,
    ...(type === "v" ? ["-fps_mode", "passthrough"] : []),
    "-f",
    "hash",
    "-hash",
    "sha256",
    "-",
  ]).trim();
afterAll(async () => {
  for (const directory of directories)
    await fs.rm(directory, { recursive: true, force: true });
});

describe.skipIf(!isFFmpegAvailable())(
  "full media and audio codec preservation",
  () => {
    async function inputs(codec: string, seconds: number) {
      const folder = await fs.mkdtemp(
        path.join(os.tmpdir(), "hls-media-integrity-"),
      );
      directories.push(folder);
      const video = path.join(folder, "video.ts"),
        audio = path.join(folder, "audio.ts");
      ffmpeg([
        "-f",
        "lavfi",
        "-i",
        "testsrc2=size=320x180:rate=25",
        "-t",
        "4",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-g",
        "25",
        "-an",
        video,
      ]);
      ffmpeg([
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=997:sample_rate=48000",
        "-t",
        String(seconds),
        "-c:a",
        codec,
        "-b:a",
        "128k",
        "-f",
        "mpegts",
        audio,
      ]);
      const adapter = await FFmpegHostAdapter.create();
      directories.push(adapter.tempDir);
      await adapter.writeFile(
        "video.ts",
        new Uint8Array(await fs.readFile(video)),
      );
      await adapter.writeFile(
        "audio.ts",
        new Uint8Array(await fs.readFile(audio)),
      );
      return { adapter, folder, video, audio };
    }

    it.each([2, 6])(
      "preserves all video and audio when the audio lasts %i seconds",
      async (seconds) => {
        const { adapter, folder, video, audio } = await inputs("aac", seconds);
        const result = await muxExec({
          ffmpeg: adapter as any,
          outputFileName: "output.mp4",
          hasVideo: true,
          hasAudio: true,
        });
        const output = path.join(folder, "saved.mp4");
        await fs.writeFile(
          output,
          new Uint8Array(await result.blob.arrayBuffer()),
        );
        expect(hash(output, "v")).toBe(hash(video, "v"));
        expect(hash(output, "a")).toBe(hash(audio, "a"));
      },
      30_000,
    );

    it.each(["ac3", "eac3", "libmp3lame"])(
      "saves a separate %s TS track without an AAC-only filter",
      async (codec) => {
        const { adapter, folder, video, audio } = await inputs(codec, 4);
        const result = await muxExec({
          ffmpeg: adapter as any,
          outputFileName: "output.mp4",
          hasVideo: true,
          hasAudio: true,
        });
        const output = path.join(folder, "saved.mp4");
        await fs.writeFile(
          output,
          new Uint8Array(await result.blob.arrayBuffer()),
        );
        expect(
          (await ffprobe(output)).streams.find(
            (stream) => stream.codec_type === "audio",
          )?.codec_name,
        ).toBe(codec === "libmp3lame" ? "mp3" : codec);
        expect(hash(output, "v")).toBe(hash(video, "v"));
        expect(hash(output, "a")).toBe(hash(audio, "a"));
      },
      30_000,
    );
  },
);
