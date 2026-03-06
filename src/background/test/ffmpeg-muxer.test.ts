import { vi, describe, it, expect, beforeEach } from "vitest";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import {
  writeMediaToFFmpegFS,
  muxExec,
  muxStreams,
} from "../src/services/ffmpeg-muxer";

function createMockFFmpeg() {
  return {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    exec: vi.fn().mockResolvedValue(0),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  } as unknown as FFmpeg;
}

describe("writeMediaToFFmpegFS", () => {
  it("writes Uint8Array directly to FFmpeg FS", async () => {
    const ffmpeg = createMockFFmpeg();
    const data = new Uint8Array([10, 20, 30]);

    await writeMediaToFFmpegFS(ffmpeg, "video.ts", data);

    expect(ffmpeg.writeFile).toHaveBeenCalledWith("video.ts", data);
  });

  it("passes through filename correctly", async () => {
    const ffmpeg = createMockFFmpeg();
    const data = new Uint8Array([1]);

    await writeMediaToFFmpegFS(ffmpeg, "audio.ts", data);

    expect(ffmpeg.writeFile).toHaveBeenCalledWith("audio.ts", data);
  });
});

describe("muxExec", () => {
  let ffmpeg: FFmpeg;

  beforeEach(() => {
    ffmpeg = createMockFFmpeg();
  });

  it("throws 'No media to mux' when hasVideo=false and hasAudio=false", async () => {
    await expect(
      muxExec({
        ffmpeg,
        outputFileName: "output.mp4",
        hasVideo: false,
        hasAudio: false,
      })
    ).rejects.toThrow("No media to mux");
  });

  it("video-only: correct args", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("-i");
    expect(args).toContain("video.ts");
    expect(args).toContain("0:v");
    expect(args).toContain("0:a?");
    expect(args).toContain("-c");
    expect(args).toContain("copy");
    expect(args).not.toContain("audio.ts");
  });

  it("audio-only: correct args", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: false,
      hasAudio: true,
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("-i");
    expect(args).toContain("audio.ts");
    expect(args).toContain("-c:a");
    expect(args).toContain("aac");
    expect(args).toContain("-b:a");
    expect(args).toContain("192k");
    expect(args).not.toContain("video.ts");
  });

  it("video+audio: correct args", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("video.ts");
    expect(args).toContain("audio.ts");
    expect(args).toContain("0:v:0");
    expect(args).toContain("1:a:0");
    expect(args).toContain("-bsf:a");
    expect(args).toContain("aac_adtstoasc");
  });

  it("video+audio+subtitles: writes subtitles.vtt, correct map indices", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mkv",
      hasVideo: true,
      hasAudio: true,
      subtitleText: "WEBVTT\n\n00:00.000 --> 00:01.000\nHello",
      subtitleLanguage: "en",
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith(
      "subtitles.vtt",
      expect.any(Uint8Array)
    );

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("subtitles.vtt");
    expect(args).toContain("2:s:0");
    expect(args).toContain("-c:s");
    expect(args).toContain("webvtt");
    expect(args).toContain("-metadata:s:s:0");
    expect(args).toContain("language=en");
  });

  it("video+subtitles (no audio): subtitle map index is 1:s:0", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mkv",
      hasVideo: true,
      hasAudio: false,
      subtitleText: "WEBVTT\n\ntest",
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("1:s:0");
    expect(args).not.toContain("2:s:0");
  });

  it("audio+subtitles (no video): subtitle map index is 1:s:0", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mkv",
      hasVideo: false,
      hasAudio: true,
      subtitleText: "WEBVTT\n\ntest",
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("1:s:0");
    expect(args).not.toContain("2:s:0");
  });

  it("default subtitle language 'und' when not specified", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mkv",
      hasVideo: true,
      hasAudio: false,
      subtitleText: "WEBVTT\n\ntest",
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("language=und");
  });

  it("returns video/mp4 MIME without subtitles", async () => {
    const result = await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });

    expect(result.mime).toBe("video/mp4");
  });

  it("returns video/x-matroska MIME with subtitles", async () => {
    const result = await muxExec({
      ffmpeg,
      outputFileName: "output.mkv",
      hasVideo: true,
      hasAudio: false,
      subtitleText: "WEBVTT\n\ntest",
    });

    expect(result.mime).toBe("video/x-matroska");
  });

  it("cleanup: deleteFile called for all written files", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mkv",
      hasVideo: true,
      hasAudio: true,
      subtitleText: "WEBVTT\n\ntest",
    });

    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("video.ts");
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("audio.ts");
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("subtitles.vtt");
  });

  it("throws on non-zero FFmpeg exit code", async () => {
    (ffmpeg.exec as ReturnType<typeof vi.fn>).mockResolvedValueOnce(1);

    await expect(
      muxExec({
        ffmpeg,
        outputFileName: "output.mp4",
        hasVideo: true,
        hasAudio: false,
      })
    ).rejects.toThrow("FFmpeg exited with code 1");
  });

  it("includes -shortest only when both video and audio", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
    });
    const argsVA = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(argsVA).toContain("-shortest");

    const ffmpeg2 = createMockFFmpeg();
    await muxExec({
      ffmpeg: ffmpeg2,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });
    const argsV = (ffmpeg2.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(argsV).not.toContain("-shortest");

    const ffmpeg3 = createMockFFmpeg();
    await muxExec({
      ffmpeg: ffmpeg3,
      outputFileName: "output.mp4",
      hasVideo: false,
      hasAudio: true,
    });
    const argsA = (ffmpeg3.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(argsA).not.toContain("-shortest");
  });

  it("cleanup on exec error: deleteFile still called", async () => {
    (ffmpeg.exec as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("exec failed")
    );

    await expect(
      muxExec({
        ffmpeg,
        outputFileName: "output.mp4",
        hasVideo: true,
        hasAudio: true,
      })
    ).rejects.toThrow("exec failed");

    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("video.ts");
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("audio.ts");
  });

  it("cleanup failure doesn't throw: deleteFile rejection swallowed", async () => {
    (ffmpeg.deleteFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("delete failed")
    );

    const result = await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });

    expect(result.blob).toBeDefined();
  });
});

describe("muxStreams", () => {
  it("accepts Uint8Array videoData/audioData, forwards to writeFile correctly", async () => {
    const ffmpeg = createMockFFmpeg();
    const videoData = new Uint8Array([1, 2, 3]);
    const audioData = new Uint8Array([4, 5, 6]);

    await muxStreams({
      ffmpeg,
      outputFileName: "output.mp4",
      videoData,
      audioData,
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith("video.ts", videoData);
    expect(ffmpeg.writeFile).toHaveBeenCalledWith("audio.ts", audioData);
    expect(ffmpeg.exec).toHaveBeenCalled();
  });

  it("handles video-only without audioData", async () => {
    const ffmpeg = createMockFFmpeg();
    const videoData = new Uint8Array([1, 2, 3]);

    await muxStreams({
      ffmpeg,
      outputFileName: "output.mp4",
      videoData,
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith("video.ts", videoData);
    expect(ffmpeg.writeFile).not.toHaveBeenCalledWith(
      "audio.ts",
      expect.anything()
    );
  });
});
