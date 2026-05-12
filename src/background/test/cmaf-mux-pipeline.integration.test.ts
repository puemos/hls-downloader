import "fake-indexeddb/auto";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
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

// ── fMP4 helper ──

function buildFmp4Data(size: number, fillByte: number = 0): Uint8Array {
  const data = new Uint8Array(size);
  data.fill(fillByte);
  // Write ftyp box header at offset 0
  const boxSize = Math.min(size, 24);
  data[0] = (boxSize >> 24) & 0xff;
  data[1] = (boxSize >> 16) & 0xff;
  data[2] = (boxSize >> 8) & 0xff;
  data[3] = boxSize & 0xff;
  data[4] = 0x66; // 'f'
  data[5] = 0x74; // 't'
  data[6] = 0x79; // 'y'
  data[7] = 0x70; // 'p'
  return data;
}

// ── Tests ──

describe("CMAF Mux Pipeline Integration", () => {
  beforeEach(() => {
    mock.reset();
  });

  afterEach(async () => {
    await IndexedDBFS.cleanup();
    vi.clearAllMocks();
  });

  it("fMP4 v+a: filenames are .mp4, no aac_adtstoasc, has copy codecs", async () => {
    const id = "fmp4-va-test";
    await IndexedDBFS.createBucket(id, 1, 1);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    const videoData = buildFmp4Data(512, 0x10);
    const audioData = buildFmp4Data(256, 0x20);

    await bucket.write(0, videoData.buffer);
    await bucket.write(1, audioData.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    const audioWrite = mock.getAudioWrite();

    expect(videoWrite).toBeDefined();
    expect(audioWrite).toBeDefined();

    // Filenames must be .mp4 for fMP4 data
    expect(videoWrite!.filename).toBe("video.mp4");
    expect(audioWrite!.filename).toBe("audio.mp4");

    // Data sizes should match
    expect(videoWrite!.data.byteLength).toBe(512);
    expect(audioWrite!.data.byteLength).toBe(256);

    // Check exec args
    const args = mock.getExecArgs()[0];
    expect(args).toContain("-c:v");
    expect(args).toContain("copy");
    expect(args).toContain("-c:a");

    // No aac_adtstoasc for fMP4
    expect(args).not.toContain("aac_adtstoasc");
    expect(args).not.toContain("-bsf:a");

    await IndexedDBFS.deleteBucket(id);
  });

  it("fMP4 video-only: filename is video.mp4, uses 0:v/0:a? mapping", async () => {
    const id = "fmp4-v-only-test";
    await IndexedDBFS.createBucket(id, 1, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    const videoData = buildFmp4Data(512, 0x30);
    await bucket.write(0, videoData.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();
    expect(videoWrite!.filename).toBe("video.mp4");
    expect(videoWrite!.data.byteLength).toBe(512);

    // No audio write
    expect(mock.getAudioWrite()).toBeUndefined();

    // Check mapping args
    const args = mock.getExecArgs()[0];
    expect(args).toContain("0:v");
    expect(args).toContain("0:a?");
    expect(args).toContain("-c");
    expect(args).toContain("copy");

    await IndexedDBFS.deleteBucket(id);
  });

  it("fMP4 with subtitles: MKV output, correct subtitle mapping", async () => {
    const id = "fmp4-subtitle-test";
    await IndexedDBFS.createBucket(id, 1, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    const videoData = buildFmp4Data(512, 0x40);
    await bucket.write(0, videoData.buffer);

    await IndexedDBFS.setSubtitleText(id, {
      text: "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nCMAF subtitle",
      language: "en",
    });

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();
    expect(videoWrite!.filename).toBe("video.mp4");

    // Subtitle should be written
    const subtitleWrite = mock.getSubtitleWrite();
    expect(subtitleWrite).toBeDefined();

    const subtitleText = new TextDecoder().decode(subtitleWrite!.data);
    expect(subtitleText).toContain("WEBVTT");
    expect(subtitleText).toContain("CMAF subtitle");

    // Check args for MKV output and subtitle metadata
    const args = mock.getExecArgs()[0];
    expect(args).toContain("output.mkv");
    expect(args).toContain("subtitles.vtt");
    expect(args).toContain("webvtt");
    expect(args).toContain("language=en");

    await IndexedDBFS.deleteBucket(id);
  });

  it("backward compat: TS data still uses .ts filenames and aac_adtstoasc", async () => {
    const id = "ts-compat-test";
    await IndexedDBFS.createBucket(id, 1, 1);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    // TS data starts with sync byte 0x47, NOT ftyp
    const tsVideo = new Uint8Array(512);
    tsVideo[0] = 0x47;
    const tsAudio = new Uint8Array(256);
    tsAudio[0] = 0x47;

    await bucket.write(0, tsVideo.buffer);
    await bucket.write(1, tsAudio.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    const audioWrite = mock.getAudioWrite();

    expect(videoWrite).toBeDefined();
    expect(audioWrite).toBeDefined();

    // Filenames must be .ts for TS data
    expect(videoWrite!.filename).toBe("video.ts");
    expect(audioWrite!.filename).toBe("audio.ts");

    // Should have aac_adtstoasc for TS
    const args = mock.getExecArgs()[0];
    expect(args).toContain("-bsf:a");
    expect(args).toContain("aac_adtstoasc");

    await IndexedDBFS.deleteBucket(id);
  });

  it("out-of-order fMP4 chunks: correct concatenation order and format detection", async () => {
    const id = "fmp4-ooo-test";
    await IndexedDBFS.createBucket(id, 3, 0);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    // Only the first chunk has ftyp header (like a real fMP4 init+media)
    const chunk0 = buildFmp4Data(128, 0x50);
    const chunk1 = new Uint8Array(128);
    chunk1.fill(0x51);
    const chunk2 = new Uint8Array(128);
    chunk2.fill(0x52);

    // Write out of order
    await bucket.write(2, chunk2.buffer);
    await bucket.write(0, chunk0.buffer);
    await bucket.write(1, chunk1.buffer);

    await bucket.getLink();

    const videoWrite = mock.getVideoWrite();
    expect(videoWrite).toBeDefined();

    // Concatenated size should be all 3 chunks
    const expectedSize =
      chunk0.byteLength + chunk1.byteLength + chunk2.byteLength;
    expect(videoWrite!.data.byteLength).toBe(expectedSize);

    // Format detection: first chunk has ftyp → filename should be .mp4
    expect(videoWrite!.filename).toBe("video.mp4");

    // Verify ordering
    const slice0 = videoWrite!.data.slice(0, 128);
    const slice1 = videoWrite!.data.slice(128, 256);
    const slice2 = videoWrite!.data.slice(256, 384);

    expect(slice0).toEqual(chunk0);
    expect(slice1).toEqual(chunk1);
    expect(slice2).toEqual(chunk2);

    await IndexedDBFS.deleteBucket(id);
  });

  it("cleanup: deleteFile called with .mp4 filenames for fMP4 data", async () => {
    const id = "fmp4-cleanup-test";
    await IndexedDBFS.createBucket(id, 1, 1);
    const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

    const videoData = buildFmp4Data(256, 0x60);
    const audioData = buildFmp4Data(128, 0x70);

    await bucket.write(0, videoData.buffer);
    await bucket.write(1, audioData.buffer);

    await bucket.getLink();

    // deleteFile should be called with .mp4 filenames
    expect(mock.getDeletedFiles()).toContain("video.mp4");
    expect(mock.getDeletedFiles()).toContain("audio.mp4");

    await IndexedDBFS.deleteBucket(id);
  });
});
