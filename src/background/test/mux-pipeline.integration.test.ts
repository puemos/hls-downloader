import "fake-indexeddb/auto";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  type FFmpegCaptureState,
  captureHelpers,
} from "./helpers/ffmpeg-capture-mock";

// ── vi.hoisted: state created at hoist-time so vi.mock factories can use it ──
const capture = vi.hoisted<FFmpegCaptureState>(() => ({
  writes: [],
  execArgs: [],
  deletedFiles: [],
  execReturnValue: 0,
}));
const mock = captureHelpers(capture);

// ── Module mocks ──

vi.mock("webextension-polyfill", () => {
  const onChangedListeners: Function[] = [];
  const downloads = {
    download: vi.fn().mockResolvedValue(42),
    onChanged: {
      addListener: vi.fn((fn: Function) => onChangedListeners.push(fn)),
      removeListener: vi.fn(),
      _listeners: onChangedListeners,
    },
  };
  const storage = {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
  };
  return {
    default: { downloads, storage },
    downloads,
    storage,
  };
});

vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    writeFile: vi.fn(async (filename: string, data: Uint8Array) => {
      capture.writes.push({ filename, data: new Uint8Array(data) });
    }),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([0, 0, 0, 0])),
    exec: vi.fn(async (args: string[]) => {
      capture.execArgs.push([...args]);
      return capture.execReturnValue;
    }),
    deleteFile: vi.fn(async (filename: string) => {
      capture.deletedFiles.push(filename);
    }),
  })),
}));

Object.defineProperty(global, "window", {
  value: {
    URL: {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    },
    webkitURL: {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    },
  },
  writable: true,
});

// ── Imports (after mocks) ──

import { IndexedDBFS, IndexedDBBucket } from "../src/services/indexedb-fs";

// ── Fixture loading ──

const FIXTURES_DIR = path.join(__dirname, "fixtures");

function loadFixture(name: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(FIXTURES_DIR, name)));
}

const TS_SYNC_BYTE = 0x47;

// ── Tests ──

describe("Mux Pipeline Integration", () => {
  let videoAudioMuxed: Uint8Array;
  let videoAudioSeg2: Uint8Array;
  let videoOnly: Uint8Array;
  let audioOnly: Uint8Array;
  let muxedWithData: Uint8Array;

  beforeEach(() => {
    videoAudioMuxed = loadFixture("video-audio-muxed.ts");
    videoAudioSeg2 = loadFixture("video-audio-seg2.ts");
    videoOnly = loadFixture("video-only.ts");
    audioOnly = loadFixture("audio-only.ts");
    muxedWithData = loadFixture("muxed-with-data-stream.ts");

    mock.reset();
  });

  afterEach(async () => {
    await IndexedDBFS.cleanup();
    vi.clearAllMocks();
  });

  it("muxed v+a: 2 segments stored, concatenated correctly with valid TS data", async () => {
    const id = "mux-concat-test";
    await IndexedDBFS.createBucket(id, 2, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, videoAudioMuxed.buffer);
    await bucket.write(1, videoAudioSeg2.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();

    // Concatenated data should equal both segments joined
    const expectedSize = videoAudioMuxed.byteLength + videoAudioSeg2.byteLength;
    expect(videoWrite!.data.byteLength).toBe(expectedSize);

    // First byte of concatenated data must be TS sync byte
    expect(videoWrite!.data[0]).toBe(TS_SYNC_BYTE);

    // The second segment should start at the right offset
    const seg2Start = videoAudioMuxed.byteLength;
    expect(videoWrite!.data[seg2Start]).toBe(TS_SYNC_BYTE);

    // Verify each segment's bytes match the original fixture exactly
    const firstSegSlice = videoWrite!.data.slice(0, videoAudioMuxed.byteLength);
    expect(firstSegSlice).toEqual(videoAudioMuxed);

    const secondSegSlice = videoWrite!.data.slice(seg2Start);
    expect(secondSegSlice).toEqual(videoAudioSeg2);

    await IndexedDBFS.deleteBucket(id);
  });

  it("separate video + audio: two writeFile calls with correct data", async () => {
    const id = "separate-va-test";
    await IndexedDBFS.createBucket(id, 1, 1);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, videoOnly.buffer);
    await bucket.write(1, audioOnly.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    const audioWrite = mock.getAudioWrite();

    expect(videoWrite).toBeDefined();
    expect(audioWrite).toBeDefined();

    // Data sizes should match original fixtures
    expect(videoWrite!.data.byteLength).toBe(videoOnly.byteLength);
    expect(audioWrite!.data.byteLength).toBe(audioOnly.byteLength);

    // Both should start with TS sync byte
    expect(videoWrite!.data[0]).toBe(TS_SYNC_BYTE);
    expect(audioWrite!.data[0]).toBe(TS_SYNC_BYTE);

    // Verify byte-for-byte match
    expect(videoWrite!.data).toEqual(videoOnly);
    expect(audioWrite!.data).toEqual(audioOnly);

    // Check exec args map video and audio from separate inputs
    const args = mock.getExecArgs()[0];
    expect(args).toContain("0:v:0");
    expect(args).toContain("1:a:0");
    expect(args).toContain("-bsf:a");
    expect(args).toContain("aac_adtstoasc");

    await IndexedDBFS.deleteBucket(id);
  });

  it("muxed with extra stream: maps 0:v and 0:a?, not bare 0", async () => {
    const id = "data-stream-test";
    await IndexedDBFS.createBucket(id, 1, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, muxedWithData.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();
    expect(videoWrite!.data.byteLength).toBe(muxedWithData.byteLength);
    expect(videoWrite!.data[0]).toBe(TS_SYNC_BYTE);

    // The key assertion: args should use explicit stream selectors, not bare "0"
    // which would pull in the data/metadata stream (the #509 bug)
    const args = mock.getExecArgs()[0];
    expect(args).toContain("0:v");
    expect(args).toContain("0:a?");
    // Must NOT contain a bare "-map 0" which maps all streams
    const mapIndices = args
      .map((a, i) => (a === "-map" ? i : -1))
      .filter((i) => i >= 0);
    for (const idx of mapIndices) {
      const mapValue = args[idx + 1];
      expect(mapValue).not.toBe("0");
    }

    await IndexedDBFS.deleteBucket(id);
  });

  it("audio-only bucket: only audio.ts writeFile, correct exec args", async () => {
    const id = "audio-only-test";
    await IndexedDBFS.createBucket(id, 0, 1);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, audioOnly.buffer);

    await bucket.getLink();

    // Should only write audio.ts, no video.ts
    expect(mock.getVideoWrite()).toBeUndefined();
    const audioWrite = mock.getAudioWrite();
    expect(audioWrite).toBeDefined();

    expect(audioWrite!.data.byteLength).toBe(audioOnly.byteLength);
    expect(audioWrite!.data).toEqual(audioOnly);

    // Check audio-only exec args
    const args = mock.getExecArgs()[0];
    expect(args).toContain("aac");
    expect(args).toContain("192k");
    expect(args).not.toContain("video.ts");

    await IndexedDBFS.deleteBucket(id);
  });

  it("out-of-order chunk writes produce correct sequential order", async () => {
    const id = "ooo-test";
    await IndexedDBFS.createBucket(id, 3, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    const chunk0 = videoAudioMuxed;
    const chunk1 = videoAudioSeg2;
    const chunk2 = videoOnly;

    // Write out of order
    await bucket.write(2, chunk2.buffer);
    await bucket.write(0, chunk0.buffer);
    await bucket.write(1, chunk1.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();

    const expectedSize =
      chunk0.byteLength + chunk1.byteLength + chunk2.byteLength;
    expect(videoWrite!.data.byteLength).toBe(expectedSize);

    // Verify ordering: chunk0 comes first, then chunk1, then chunk2
    const slice0 = videoWrite!.data.slice(0, chunk0.byteLength);
    const slice1 = videoWrite!.data.slice(
      chunk0.byteLength,
      chunk0.byteLength + chunk1.byteLength
    );
    const slice2 = videoWrite!.data.slice(
      chunk0.byteLength + chunk1.byteLength
    );

    expect(slice0).toEqual(chunk0);
    expect(slice1).toEqual(chunk1);
    expect(slice2).toEqual(chunk2);

    await IndexedDBFS.deleteBucket(id);
  });

  it("subtitles produce MKV with subtitle metadata in args", async () => {
    const id = "subtitle-test";
    await IndexedDBFS.createBucket(id, 1, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, videoOnly.buffer);

    await IndexedDBFS.setSubtitleText(id, {
      text: "WEBVTT\n\n00:00:00.000 --> 00:00:00.500\nHello world",
      language: "en",
    });

    await bucket.getLink();

    // Check that subtitles.vtt was written to FFmpeg FS
    const subtitleWrite = mock.getSubtitleWrite();
    expect(subtitleWrite).toBeDefined();

    // Verify subtitle content is actual WebVTT text
    const subtitleText = new TextDecoder().decode(subtitleWrite!.data);
    expect(subtitleText).toContain("WEBVTT");
    expect(subtitleText).toContain("Hello world");

    // Check exec args for MKV output and subtitle metadata
    const args = mock.getExecArgs()[0];
    expect(args).toContain("output.mkv");
    expect(args).toContain("subtitles.vtt");
    expect(args).toContain("webvtt");
    expect(args).toContain("language=en");

    await IndexedDBFS.deleteBucket(id);
  });

  it("sparse bucket (missing chunk) still muxes with available data", async () => {
    const id = "sparse-test";
    await IndexedDBFS.createBucket(id, 3, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    const chunk0 = videoAudioMuxed;
    const chunk2 = videoOnly;

    await bucket.write(0, chunk0.buffer);
    // Skip index 1
    await bucket.write(2, chunk2.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();

    const expectedSize = chunk0.byteLength + chunk2.byteLength;
    expect(videoWrite!.data.byteLength).toBe(expectedSize);

    expect(videoWrite!.data.slice(0, chunk0.byteLength)).toEqual(chunk0);
    expect(videoWrite!.data.slice(chunk0.byteLength)).toEqual(chunk2);

    await IndexedDBFS.deleteBucket(id);
  });

  it("FFmpeg exit code 1 propagates error", async () => {
    const id = "exit-code-test";
    await IndexedDBFS.createBucket(id, 1, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, videoOnly.buffer);

    // Make FFmpeg return non-zero exit code via capture state
    capture.execReturnValue = 1;

    await expect(bucket.getLink()).rejects.toThrow("FFmpeg exited with code 1");

    await IndexedDBFS.deleteBucket(id);
  });

  it("progress callback fires with Done", async () => {
    const id = "progress-test";
    await IndexedDBFS.createBucket(id, 1, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    await bucket.write(0, videoOnly.buffer);

    const progressMock = vi.fn();
    await bucket.getLink(progressMock);

    expect(progressMock).toHaveBeenCalledWith(1, "Done");

    await IndexedDBFS.deleteBucket(id);
  });

  it("-shortest only present with both video and audio", async () => {
    // video+audio: should have -shortest
    const id1 = "shortest-va";
    await IndexedDBFS.createBucket(id1, 1, 1);
    const bucket1 = (await IndexedDBFS.getBucket(id1)) as IndexedDBBucket;
    await bucket1.write(0, videoOnly.buffer);
    await bucket1.write(1, audioOnly.buffer);
    await bucket1.getLink();

    expect(mock.getExecArgs()[0]).toContain("-shortest");

    mock.reset();

    // video-only: should NOT have -shortest
    const id2 = "shortest-v";
    await IndexedDBFS.createBucket(id2, 1, 0);
    const bucket2 = (await IndexedDBFS.getBucket(id2)) as IndexedDBBucket;
    await bucket2.write(0, videoOnly.buffer);
    await bucket2.getLink();

    expect(mock.getExecArgs()[0]).not.toContain("-shortest");

    mock.reset();

    // audio-only: should NOT have -shortest
    const id3 = "shortest-a";
    await IndexedDBFS.createBucket(id3, 0, 1);
    const bucket3 = (await IndexedDBFS.getBucket(id3)) as IndexedDBBucket;
    await bucket3.write(0, audioOnly.buffer);
    await bucket3.getLink();

    expect(mock.getExecArgs()[0]).not.toContain("-shortest");

    await IndexedDBFS.deleteBucket(id1);
    await IndexedDBFS.deleteBucket(id2);
    await IndexedDBFS.deleteBucket(id3);
  });
});
