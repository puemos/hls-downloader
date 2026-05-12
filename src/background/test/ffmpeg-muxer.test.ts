import { vi, describe, it, expect, beforeEach } from "vitest";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import {
  writeMediaToFFmpegFS,
  muxExec,
  muxStreams,
  detectFmp4,
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
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("output.mkv");
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
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("output.mp4");
  });

  it("cleanup failure doesn't throw and later files are still attempted", async () => {
    (ffmpeg.deleteFile as ReturnType<typeof vi.fn>).mockImplementation(
      async (fileName: string) => {
        if (fileName === "video.ts") {
          throw new Error("delete failed");
        }
      }
    );

    const result = await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: false,
    });

    expect(result.blob).toBeDefined();
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("video.ts");
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("output.mp4");
  });

  it("fMP4 video+audio: no aac_adtstoasc, uses .mp4 filenames", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
      videoFileName: "video.mp4",
      audioFileName: "audio.mp4",
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("video.mp4");
    expect(args).toContain("audio.mp4");
    expect(args).not.toContain("-bsf:a");
    expect(args).not.toContain("aac_adtstoasc");
    expect(args).toContain("-c:v");
    expect(args).toContain("copy");
    expect(args).toContain("-c:a");
  });

  it("fMP4 video with TS audio still applies aac_adtstoasc", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
      videoFileName: "video.mp4",
      audioFileName: "audio.ts",
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("video.mp4");
    expect(args).toContain("audio.ts");
    expect(args).toContain("-bsf:a");
    expect(args).toContain("aac_adtstoasc");
  });

  it("fMP4 cleanup: deleteFile uses .mp4 filenames", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
      videoFileName: "video.mp4",
      audioFileName: "audio.mp4",
    });

    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("video.mp4");
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("audio.mp4");
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith("output.mp4");
  });

  it("defaults to .ts filenames when not specified", async () => {
    await muxExec({
      ffmpeg,
      outputFileName: "output.mp4",
      hasVideo: true,
      hasAudio: true,
    });

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("video.ts");
    expect(args).toContain("audio.ts");
    expect(args).toContain("-bsf:a");
    expect(args).toContain("aac_adtstoasc");
  });
});

describe("detectFmp4", () => {
  it("returns true for ftyp box header", () => {
    // ftyp box: 4-byte size + "ftyp"
    const data = new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x18, // size = 24
      0x66,
      0x74,
      0x79,
      0x70, // "ftyp"
      ...new Array(16).fill(0),
    ]);
    expect(detectFmp4(data)).toBe(true);
  });

  it("returns false for MPEG-TS sync byte", () => {
    const data = new Uint8Array([
      0x47, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(detectFmp4(data)).toBe(false);
  });

  it("returns false for data shorter than 8 bytes", () => {
    expect(detectFmp4(new Uint8Array([1, 2, 3]))).toBe(false);
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

  it("auto-detects fMP4 and uses .mp4 filenames", async () => {
    const ffmpeg = createMockFFmpeg();
    // ftyp box header
    const fmp4Video = new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x18,
      0x66,
      0x74,
      0x79,
      0x70,
      ...new Array(16).fill(0),
    ]);
    const fmp4Audio = new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x18,
      0x66,
      0x74,
      0x79,
      0x70,
      ...new Array(16).fill(0),
    ]);

    await muxStreams({
      ffmpeg,
      outputFileName: "output.mp4",
      videoData: fmp4Video,
      audioData: fmp4Audio,
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith("video.mp4", fmp4Video);
    expect(ffmpeg.writeFile).toHaveBeenCalledWith("audio.mp4", fmp4Audio);

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).not.toContain("aac_adtstoasc");
  });

  it("uses .ts filenames for MPEG-TS data", async () => {
    const ffmpeg = createMockFFmpeg();
    // TS sync byte
    const tsVideo = new Uint8Array([
      0x47, 0x00, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    const tsAudio = new Uint8Array([
      0x47, 0x00, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    await muxStreams({
      ffmpeg,
      outputFileName: "output.mp4",
      videoData: tsVideo,
      audioData: tsAudio,
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith("video.ts", tsVideo);
    expect(ffmpeg.writeFile).toHaveBeenCalledWith("audio.ts", tsAudio);

    const args = (ffmpeg.exec as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args).toContain("aac_adtstoasc");
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
