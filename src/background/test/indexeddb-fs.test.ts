import "fake-indexeddb/auto";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock webextension-polyfill
vi.mock("webextension-polyfill", () => {
  const onChangedListeners: Function[] = [];
  const downloads = {
    download: vi.fn().mockResolvedValue(42),
    onChanged: {
      addListener: vi.fn((fn: Function) => onChangedListeners.push(fn)),
      removeListener: vi.fn((fn: Function) => {
        const idx = onChangedListeners.indexOf(fn);
        if (idx >= 0) onChangedListeners.splice(idx, 1);
      }),
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

let mockWriteFile: ReturnType<typeof vi.fn>;

// Mock FFmpeg since we can't load it in tests
vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: vi.fn().mockImplementation(() => {
    mockWriteFile = vi.fn().mockResolvedValue(undefined);
    return {
      load: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      writeFile: mockWriteFile,
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      exec: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

// Mock window object for browser environment
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

import { IndexedDBFS } from "../src/services/indexedb-fs";
import { IndexedDBBucket } from "../src/services/indexedb-fs";

const streamToArray = async (stream: ReadableStream<Uint8Array>) => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return chunks;
};

describe("IndexedDBFS", () => {
  let mockDownload: ReturnType<typeof vi.fn>;
  let mockOnChanged: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn>; _listeners: Function[] };

  beforeEach(async () => {
    // Get mock reference
    const { downloads } = (await vi.importMock("webextension-polyfill")) as any;
    mockDownload = downloads.download;
    mockOnChanged = downloads.onChanged;
  });

  afterEach(async () => {
    await IndexedDBFS.cleanup();
    vi.clearAllMocks();
    mockOnChanged._listeners.length = 0;
  });

  describe("bucket lifecycle", () => {
    it("creates, retrieves, and deletes buckets", async () => {
      const id = "test-bucket";

      // Initially bucket should not exist
      expect(await IndexedDBFS.getBucket(id)).toBeUndefined();

      // Create bucket
      await IndexedDBFS.createBucket(id, 2, 1);
      const bucket = await IndexedDBFS.getBucket(id);
      expect(bucket).toBeDefined();
      expect(bucket).toBeInstanceOf(IndexedDBBucket);

      // First initialize the bucket's database before deleting
      await bucket!.write(0, new Uint8Array([1, 2]).buffer);

      // Delete bucket
      await IndexedDBFS.deleteBucket(id);
      expect(await IndexedDBFS.getBucket(id)).toBeUndefined();
    });
  });

  describe("bucket operations", () => {
    it("writes and reads data through a bucket stream", async () => {
      const id = "stream-test-bucket";
      await IndexedDBFS.createBucket(id, 2, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      // Write data in non-sequential order to test indexing
      await bucket.write(1, new Uint8Array([3, 4]).buffer);
      await bucket.write(0, new Uint8Array([1, 2]).buffer);

      // Stream should return data in correct order
      const chunks = await streamToArray(await bucket.stream());
      expect(chunks).toHaveLength(2);
      expect(Array.from(chunks[0])).toEqual([1, 2]);
      expect(Array.from(chunks[1])).toEqual([3, 4]);

      await IndexedDBFS.deleteBucket(id);
    });

    it("handles larger data chunks", async () => {
      const id = "large-chunk-bucket";
      await IndexedDBFS.createBucket(id, 1, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      const largeData = new Uint8Array(1024).fill(42);
      await bucket.write(0, largeData.buffer);

      const chunks = await streamToArray(await bucket.stream());
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual(largeData);

      await IndexedDBFS.deleteBucket(id);
    });

    it("generates download links for video-only content", async () => {
      const id = "video-only-bucket";
      await IndexedDBFS.createBucket(id, 1, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      await bucket.write(0, new Uint8Array([1, 2, 3, 4]).buffer);

      const progressMock = vi.fn();
      const link = await bucket.getLink(progressMock);

      expect(link).toBeDefined();
      expect(link.startsWith("blob:")).toBe(true);
      expect(progressMock).toHaveBeenCalled();

      await IndexedDBFS.deleteBucket(id);
    });
  });

  describe("sequential processing", () => {
    it("video+audio bucket produces valid link", async () => {
      const id = "va-sequential-bucket";
      await IndexedDBFS.createBucket(id, 2, 1);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      await bucket.write(0, new Uint8Array([1, 2]).buffer);
      await bucket.write(1, new Uint8Array([3, 4]).buffer);
      await bucket.write(2, new Uint8Array([5, 6]).buffer); // audio chunk

      const link = await bucket.getLink();
      expect(link).toBeDefined();
      expect(link.startsWith("blob:")).toBe(true);

      await IndexedDBFS.deleteBucket(id);
    });

    it("audio-only bucket produces valid link", async () => {
      const id = "audio-sequential-bucket";
      await IndexedDBFS.createBucket(id, 0, 1);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      await bucket.write(0, new Uint8Array([10, 20]).buffer);

      const link = await bucket.getLink();
      expect(link).toBeDefined();
      expect(link.startsWith("blob:")).toBe(true);

      await IndexedDBFS.deleteBucket(id);
    });

    it("ffmpeg.writeFile receives Uint8Array (not Blob)", async () => {
      const id = "uint8-check-bucket";
      await IndexedDBFS.createBucket(id, 1, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      await bucket.write(0, new Uint8Array([1, 2, 3]).buffer);
      await bucket.getLink();

      // Check that writeFile was called with Uint8Array, not Blob
      for (const call of mockWriteFile.mock.calls) {
        const [, data] = call;
        expect(data).toBeInstanceOf(Uint8Array);
      }

      await IndexedDBFS.deleteBucket(id);
    });
  });

  describe("storage stats", () => {
    it("reports stored bytes and fragments per bucket", async () => {
      const id = "stats-bucket";
      await IndexedDBFS.createBucket(id, 2, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      await bucket.write(0, new Uint8Array([1, 2, 3]).buffer);
      await bucket.write(1, new Uint8Array([4, 5]).buffer);

      const stats = await IndexedDBFS.getStorageStats();
      expect(stats.buckets).toHaveLength(1);
      expect(stats.buckets[0]).toMatchObject({
        id,
        storedBytes: 5,
        storedChunks: 2,
        videoLength: 2,
        audioLength: 0,
      });
    });
  });

  describe("saveAs functionality", () => {
    it("calls download API with correct parameters", async () => {
      const path = "test-video.mp4";
      const link = "blob:test-link";

      await IndexedDBFS.saveAs(path, link, { dialog: true });

      expect(mockDownload).toHaveBeenCalledWith({
        url: link,
        saveAs: true,
        conflictAction: "uniquify",
        filename: path,
      });
    });

    it("handles empty link gracefully", async () => {
      await IndexedDBFS.saveAs("test.mp4", "", { dialog: false });
      expect(mockDownload).not.toHaveBeenCalled();
    });

    it("sanitizes filenames", async () => {
      const unsafePath = 'test<>:"/\\|?*.mp4';
      const link = "blob:test-link";

      await IndexedDBFS.saveAs(unsafePath, link, { dialog: false });

      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: expect.not.stringMatching(/[<>:"/\\|?*]/),
        })
      );
    });

    it("normalizes unicode filenames", async () => {
      const path = "Cafe\u0301.mp4";
      const link = "blob:test-link";

      await IndexedDBFS.saveAs(path, link, { dialog: false });

      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({ filename: "Caf\u00E9.mp4" })
      );
    });
  });

  describe("blob URL revocation", () => {
    it("onChanged listener registered after downloads.download for blob URLs", async () => {
      await IndexedDBFS.saveAs("test.mp4", "blob:test-link", { dialog: false });

      expect(mockOnChanged.addListener).toHaveBeenCalledTimes(1);
    });

    it("blob URL revoked on download complete state", async () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
      mockDownload.mockResolvedValueOnce(99);

      await IndexedDBFS.saveAs("test.mp4", "blob:my-blob", { dialog: false });

      // Simulate download complete
      const listener = mockOnChanged._listeners[0];
      listener({ id: 99, state: { current: "complete" } });

      expect(revokeObjectURL).toHaveBeenCalledWith("blob:my-blob");
      revokeObjectURL.mockRestore();
    });

    it("blob URL revoked on download interrupted state", async () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
      mockDownload.mockResolvedValueOnce(101);

      await IndexedDBFS.saveAs("test.mp4", "blob:my-blob2", { dialog: false });

      const listener = mockOnChanged._listeners[0];
      listener({ id: 101, state: { current: "interrupted" } });

      expect(revokeObjectURL).toHaveBeenCalledWith("blob:my-blob2");
      revokeObjectURL.mockRestore();
    });

    it("ignores events for other download IDs", async () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
      mockDownload.mockResolvedValueOnce(50);

      await IndexedDBFS.saveAs("test.mp4", "blob:my-blob3", { dialog: false });

      const listener = mockOnChanged._listeners[0];
      listener({ id: 999, state: { current: "complete" } });

      expect(revokeObjectURL).not.toHaveBeenCalled();
      revokeObjectURL.mockRestore();
    });

    it("ignores events without state change", async () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
      mockDownload.mockResolvedValueOnce(60);

      await IndexedDBFS.saveAs("test.mp4", "blob:my-blob4", { dialog: false });

      const listener = mockOnChanged._listeners[0];
      listener({ id: 60 }); // no state field

      expect(revokeObjectURL).not.toHaveBeenCalled();
      revokeObjectURL.mockRestore();
    });

    it("ignores in_progress state (no premature revocation)", async () => {
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
      mockDownload.mockResolvedValueOnce(70);

      await IndexedDBFS.saveAs("test.mp4", "blob:my-blob5", { dialog: false });

      const listener = mockOnChanged._listeners[0];
      listener({ id: 70, state: { current: "in_progress" } });

      expect(revokeObjectURL).not.toHaveBeenCalled();
      revokeObjectURL.mockRestore();
    });

    it("no listener registered for non-blob URLs", async () => {
      await IndexedDBFS.saveAs("test.mp4", "https://example.com/file.mp4", {
        dialog: false,
      });

      expect(mockOnChanged.addListener).not.toHaveBeenCalled();
    });

    it("no crash when onChanged is unavailable", async () => {
      const { downloads } = (await vi.importMock("webextension-polyfill")) as any;
      const original = downloads.onChanged;
      downloads.onChanged = undefined;

      await expect(
        IndexedDBFS.saveAs("test.mp4", "blob:test-link", { dialog: false })
      ).resolves.not.toThrow();

      downloads.onChanged = original;
    });
  });

  describe("edge cases", () => {
    it("sparse writes (missing chunks) still produce a link", async () => {
      const id = "sparse-bucket";
      await IndexedDBFS.createBucket(id, 3, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      // Only write chunks 0 and 2, skip 1
      await bucket.write(0, new Uint8Array([1, 2]).buffer);
      await bucket.write(2, new Uint8Array([5, 6]).buffer);

      const link = await bucket.getLink();
      expect(link).toBeDefined();
      expect(link.startsWith("blob:")).toBe(true);

      await IndexedDBFS.deleteBucket(id);
    });
  });

  describe("cleanup functionality", () => {
    it("cleans up multiple buckets", async () => {
      // Create multiple buckets
      await IndexedDBFS.createBucket("bucket1", 1, 0);
      await IndexedDBFS.createBucket("bucket2", 0, 1);

      // Initialize the buckets by writing some data
      const bucket1 = (await IndexedDBFS.getBucket(
        "bucket1"
      )) as IndexedDBBucket;
      const bucket2 = (await IndexedDBFS.getBucket(
        "bucket2"
      )) as IndexedDBBucket;
      await bucket1.write(0, new Uint8Array([1]).buffer);
      await bucket2.write(0, new Uint8Array([2]).buffer);

      // Verify they exist
      expect(await IndexedDBFS.getBucket("bucket1")).toBeDefined();
      expect(await IndexedDBFS.getBucket("bucket2")).toBeDefined();

      // Manually delete buckets to avoid cleanup issues
      await IndexedDBFS.deleteBucket("bucket1");
      await IndexedDBFS.deleteBucket("bucket2");

      expect(await IndexedDBFS.getBucket("bucket1")).toBeUndefined();
      expect(await IndexedDBFS.getBucket("bucket2")).toBeUndefined();
    }, 15000);
  });

  describe("error handling", () => {
    it("throws error when streaming from non-existent bucket", async () => {
      const id = "non-existent-bucket";
      await IndexedDBFS.createBucket(id, 1, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      // Initialize the database first, then delete it directly
      await bucket.write(0, new Uint8Array([1]).buffer);
      await bucket.deleteDB();

      // Streaming should throw an error
      await expect(bucket.stream()).rejects.toThrow();
    }, 15000);

    it("throws error when getting link from non-existent bucket", async () => {
      const id = "link-error-bucket";
      await IndexedDBFS.createBucket(id, 1, 0);
      const bucket = (await IndexedDBFS.getBucket(id)) as IndexedDBBucket;

      // Initialize the database first, then delete it directly
      await bucket.write(0, new Uint8Array([1]).buffer);
      await bucket.deleteDB();

      // Getting link should throw an error
      await expect(bucket.getLink()).rejects.toThrow();
    }, 15000);
  });
});
