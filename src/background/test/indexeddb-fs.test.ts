import "fake-indexeddb/auto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createFakeOpfs } from "./helpers/fake-opfs";

const testState = vi.hoisted(() => ({
  downloadId: 40,
  downloadStates: new Map<number, string>(),
  downloadListeners: [] as Array<
    (delta: { id: number; state?: { current: string } }) => void
  >,
  storageData: {} as Record<string, any>,
  permissions: [] as string[],
  mux: vi.fn(),
  ffmpegLoad: vi.fn(),
}));

vi.mock("webextension-polyfill", () => {
  const storage = {
    local: {
      get: vi.fn(async (key?: string) => {
        if (!key) return { ...testState.storageData };
        return { [key]: testState.storageData[key] };
      }),
      set: vi.fn(async (values: Record<string, any>) => {
        Object.assign(testState.storageData, values);
      }),
    },
  };
  const downloads = {
    download: vi.fn(async () => {
      const id = ++testState.downloadId;
      testState.downloadStates.set(id, "in_progress");
      return id;
    }),
    search: vi.fn(async ({ id }: { id: number }) => {
      const state = testState.downloadStates.get(id);
      return state ? [{ id, state }] : [];
    }),
    onChanged: {
      addListener: vi.fn(
        (
          listener: (delta: {
            id: number;
            state?: { current: string };
          }) => void,
        ) => {
          testState.downloadListeners.push(listener);
        },
      ),
    },
  };
  const runtime = {
    getManifest: vi.fn(() => ({
      permissions: [...testState.permissions],
    })),
  };
  return {
    default: { downloads, runtime, storage },
    downloads,
    runtime,
    storage,
  };
});

vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: vi.fn().mockImplementation(function () {
    return {
      load: testState.ffmpegLoad.mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      exec: vi.fn().mockResolvedValue(0),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      terminate: vi.fn(),
    };
  }),
}));

vi.mock("../src/services/disk-mux-client", () => ({
  muxDiskBackedMedia: testState.mux,
  cancelDiskBackedMux: vi.fn().mockResolvedValue(undefined),
}));

import {
  IndexedDBFS,
  IndexedDBBucket,
  OPFSBucket,
  createLegacyBucketForTests,
  releaseArtifactInCurrentContext,
} from "../src/services/disk-backed-fs";
import {
  fragmentFileName,
  getExportHandle,
  getFragmentFile,
  getTrackDirectory,
} from "../src/services/opfs-storage";
import type { PreparedDownload } from "@hls-downloader/core/lib/services";

async function writeExport(exportId: string, bytes: number[]): Promise<void> {
  const handle = await getExportHandle(exportId, true);
  const writable = await handle.createWritable();
  await writable.write(new Uint8Array(bytes));
  await writable.close();
}

async function expectExportMissing(exportId: string): Promise<void> {
  await expect(getExportHandle(exportId, false)).rejects.toMatchObject({
    name: "NotFoundError",
  });
}

function emitDownloadState(downloadId: number, state: string): void {
  testState.downloadStates.set(downloadId, state);
  for (const listener of testState.downloadListeners) {
    listener({ id: downloadId, state: { current: state } });
  }
}

describe("disk-backed filesystem", () => {
  let createObjectURL: ReturnType<typeof vi.spyOn>;
  let revokeObjectURL: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    let objectUrlId = 0;
    createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation(() => `blob:test-${++objectUrlId}`);
    revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
  });

  beforeEach(() => {
    const { storage } = createFakeOpfs();
    vi.stubGlobal("navigator", { storage });
    testState.permissions = [];
    testState.mux.mockReset();
    testState.ffmpegLoad.mockReset();
    revokeObjectURL.mockClear();
  });

  afterEach(async () => {
    await IndexedDBFS.cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it("creates new jobs in OPFS and routes global audio indices", async () => {
    await IndexedDBFS.createBucket("job", 2, 2);
    const bucket = (await IndexedDBFS.getBucket("job")) as OPFSBucket;

    expect(bucket).toBeInstanceOf(OPFSBucket);
    await bucket.write(3, new Uint8Array([31]).buffer);
    await bucket.write(0, new Uint8Array([10]).buffer);
    await bucket.write(2, new Uint8Array([20]).buffer);
    await bucket.write(1, new Uint8Array([11]).buffer);

    expect(
      new Uint8Array(
        await (
          await getFragmentFile(bucket.storageKey, "video", 0)
        ).arrayBuffer(),
      ),
    ).toEqual(new Uint8Array([10]));
    expect(
      new Uint8Array(
        await (
          await getFragmentFile(bucket.storageKey, "video", 1)
        ).arrayBuffer(),
      ),
    ).toEqual(new Uint8Array([11]));
    expect(
      new Uint8Array(
        await (
          await getFragmentFile(bucket.storageKey, "audio", 0)
        ).arrayBuffer(),
      ),
    ).toEqual(new Uint8Array([20]));
    expect(
      new Uint8Array(
        await (
          await getFragmentFile(bucket.storageKey, "audio", 1)
        ).arrayBuffer(),
      ),
    ).toEqual(new Uint8Array([31]));
  });

  it("uses stable names and accounts for fragment overwrites", async () => {
    await IndexedDBFS.createBucket("overwrite", 1, 0);
    const bucket = (await IndexedDBFS.getBucket("overwrite")) as OPFSBucket;

    expect(fragmentFileName(12)).toBe("000000012.part");
    await bucket.write(0, new Uint8Array([1, 2, 3]).buffer);
    await bucket.write(0, new Uint8Array([4, 5, 6, 7, 8]).buffer);

    const stats = await IndexedDBFS.getStorageStats();
    expect(stats.buckets[0]).toMatchObject({
      id: "overwrite",
      storedBytes: 5,
      storedChunks: 1,
    });
    expect(
      new Uint8Array(
        await (
          await getFragmentFile(bucket.storageKey, "video", 0)
        ).arrayBuffer(),
      ),
    ).toEqual(new Uint8Array([4, 5, 6, 7, 8]));
  });

  it("rejects invalid indices and writes after deletion", async () => {
    await IndexedDBFS.createBucket("bounds", 1, 1);
    const bucket = (await IndexedDBFS.getBucket("bounds")) as OPFSBucket;

    await expect(bucket.write(-1, new ArrayBuffer(1))).rejects.toThrow(
      "Invalid fragment index",
    );
    await expect(bucket.write(2, new ArrayBuffer(1))).rejects.toThrow(
      "outside bucket",
    );

    await IndexedDBFS.deleteBucket("bounds");
    await expect(bucket.write(0, new ArrayBuffer(1))).rejects.toThrow(
      "bucket was deleted",
    );
  });

  it("turns OPFS quota failures into an actionable error", async () => {
    await IndexedDBFS.createBucket("quota", 1, 0);
    const bucket = (await IndexedDBFS.getBucket("quota")) as OPFSBucket;
    const directory = await getTrackDirectory(
      bucket.storageKey,
      "video",
      false,
    );
    const handle = (await directory.getFileHandle(fragmentFileName(0), {
      create: true,
    })) as any;
    handle.nextWriteError = new DOMException("Full", "QuotaExceededError");

    await expect(bucket.write(0, new ArrayBuffer(8))).rejects.toThrow(
      "Not enough disk space",
    );
  });

  it("fails before muxing when free space cannot hold the output", async () => {
    const { storage } = createFakeOpfs({
      quota: 128 * 1024 * 1024,
      usage: 0,
    });
    vi.stubGlobal("navigator", { storage });
    await IndexedDBFS.createBucket("low-space", 1, 0);
    const bucket = (await IndexedDBFS.getBucket("low-space")) as OPFSBucket;
    await bucket.write(0, new Uint8Array([1]).buffer);

    await expect(bucket.prepareDownload()).rejects.toThrow(
      "Not enough disk space to finalize",
    );
    expect(testState.mux).not.toHaveBeenCalled();
  });

  it("requests persistent Firefox storage when the first job is created", async () => {
    testState.permissions = ["unlimitedStorage"];
    vi.stubGlobal("browser", {
      runtime: { getBrowserInfo: vi.fn() },
    });
    const { storage: opfsStorage } = createFakeOpfs();
    const storage = {
      ...opfsStorage,
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(true),
    };
    vi.stubGlobal("navigator", { storage });

    const before = await IndexedDBFS.getStorageStats();
    expect(before.estimate).toMatchObject({ persisted: false });
    expect(storage.persist).not.toHaveBeenCalled();

    await IndexedDBFS.createBucket("firefox-persistent", 1, 0);
    const stats = await IndexedDBFS.getStorageStats();

    expect(storage.persisted).toHaveBeenCalledTimes(2);
    expect(storage.persist).toHaveBeenCalledTimes(1);
    expect(stats.estimate).toMatchObject({
      persisted: true,
      quotaExempt: false,
      quotaIsAdvisory: true,
    });
  });

  it("keeps Firefox's reported limit when persistence is denied", async () => {
    testState.permissions = ["unlimitedStorage"];
    vi.stubGlobal("browser", {
      runtime: { getBrowserInfo: vi.fn() },
    });
    const { storage: opfsStorage } = createFakeOpfs({
      quota: 128 * 1024 * 1024,
      usage: 0,
    });
    const storage = {
      ...opfsStorage,
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    };
    vi.stubGlobal("navigator", { storage });
    await IndexedDBFS.createBucket("firefox-low-space", 1, 0);
    const bucket = (await IndexedDBFS.getBucket(
      "firefox-low-space",
    )) as OPFSBucket;
    await bucket.write(0, new Uint8Array([1]).buffer);

    await expect(bucket.prepareDownload()).rejects.toThrow(
      "Not enough disk space to finalize",
    );
    expect(testState.mux).not.toHaveBeenCalled();
  });

  it("does not treat a quota-exempt browser estimate as a hard limit", async () => {
    testState.permissions = ["unlimitedStorage"];
    const { storage } = createFakeOpfs({
      quota: 128 * 1024 * 1024,
      usage: 0,
    });
    vi.stubGlobal("navigator", { storage });
    await IndexedDBFS.createBucket("quota-exempt", 1, 0);
    const bucket = (await IndexedDBFS.getBucket("quota-exempt")) as OPFSBucket;
    await bucket.write(0, new Uint8Array([1]).buffer);
    await writeExport("quota-exempt.mp4", [9]);
    testState.mux.mockResolvedValue({
      type: "success",
      requestId: "request",
      exportId: "quota-exempt.mp4",
      mime: "video/mp4",
      size: 1,
      wasmMemoryBytes: 32 * 1024 * 1024,
    });

    const artifact = await bucket.prepareDownload();
    const stats = await IndexedDBFS.getStorageStats();

    expect(testState.mux).toHaveBeenCalledTimes(1);
    expect(stats.estimate).toMatchObject({
      quota: 128 * 1024 * 1024,
      quotaExempt: true,
      quotaIsAdvisory: true,
    });
    await releaseArtifactInCurrentContext(artifact);
  });

  it("does not start the worker with missing OPFS fragments", async () => {
    await IndexedDBFS.createBucket("incomplete", 2, 0);
    const bucket = (await IndexedDBFS.getBucket("incomplete")) as OPFSBucket;
    await bucket.write(0, new Uint8Array([1]).buffer);

    await expect(bucket.prepareDownload()).rejects.toThrow(
      /expected 2 fragments but found 1.*Re-download/,
    );
    expect(testState.mux).not.toHaveBeenCalled();
  });

  it("returns a structured OPFS artifact without reading media into JS", async () => {
    await IndexedDBFS.createBucket("prepare", 1, 1);
    const bucket = (await IndexedDBFS.getBucket("prepare")) as OPFSBucket;
    await bucket.write(0, new Uint8Array([1]).buffer);
    await bucket.write(1, new Uint8Array([2]).buffer);
    await writeExport("prepared.mp4", [9, 8, 7]);
    testState.mux.mockResolvedValue({
      type: "success",
      requestId: "request",
      exportId: "prepared.mp4",
      mime: "video/mp4",
      size: 3,
      wasmMemoryBytes: 32 * 1024 * 1024,
    });
    const progress = vi.fn();

    const artifact = await bucket.prepareDownload(progress);
    const duplicateArtifact = await bucket.prepareDownload(progress);

    expect(artifact).toEqual({
      url: expect.stringMatching(/^blob:test-\d+$/),
      exportId: "prepared.mp4",
      mime: "video/mp4",
      size: 3,
    });
    expect(duplicateArtifact).toEqual(artifact);
    expect(testState.mux).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: bucket.storageKey,
        videoLength: 1,
        audioLength: 1,
        container: "mp4",
      }),
      progress,
    );
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(File));
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    await releaseArtifactInCurrentContext(artifact);
    await expectExportMissing("prepared.mp4");
  });

  it("keeps legacy IndexedDB jobs readable without migrating them", async () => {
    const bucket = await createLegacyBucketForTests("legacy", 1, 0);
    expect(bucket).toBeInstanceOf(IndexedDBBucket);
    await bucket.write(0, new Uint8Array([1, 2, 3]).buffer);

    const artifact = await bucket.prepareDownload();

    expect(artifact).toMatchObject({
      url: expect.stringMatching(/^blob:/),
      exportId: expect.stringMatching(/^legacy-/),
      mime: "video/mp4",
      size: 4,
    });
    expect(testState.ffmpegLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        classWorkerURL: expect.stringMatching(
          /^(https?:|moz-extension:|chrome-extension:)/,
        ),
      }),
    );
    await releaseArtifactInCurrentContext(artifact);
  });

  it("prepares standalone text through the filesystem artifact owner", async () => {
    const artifact = await IndexedDBFS.prepareTextDownload(
      "WEBVTT",
      "text/vtt",
    );

    expect(artifact).toMatchObject({
      url: expect.stringMatching(/^blob:/),
      exportId: expect.stringMatching(/^legacy-text-/),
      mime: "text/vtt",
      size: 6,
    });
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: "text/vtt", size: 6 }),
    );
    await releaseArtifactInCurrentContext(artifact);
  });

  it("reports missing legacy fragments and asks for a re-download", async () => {
    const bucket = await createLegacyBucketForTests("legacy-sparse", 2, 0);
    await bucket.write(0, new Uint8Array([1]).buffer);

    await expect(bucket.prepareDownload()).rejects.toThrow(
      /Missing video fragment 1.*Re-download/,
    );
  });

  it("leases an artifact until its browser download completes", async () => {
    const artifact: PreparedDownload = {
      url: "blob:leased",
      exportId: "leased.mp4",
      mime: "video/mp4",
      size: 3,
    };
    await writeExport(artifact.exportId, [1, 2, 3]);

    const downloadId = await IndexedDBFS.saveAs(
      'unsafe<>:"/name.mp4',
      artifact,
      { dialog: true },
    );

    const { downloads } = (await vi.importMock("webextension-polyfill")) as any;
    expect(downloads.download).toHaveBeenCalledWith({
      url: artifact.url,
      saveAs: true,
      conflictAction: "uniquify",
      filename: "unsafe!name.mp4",
    });
    expect(
      testState.storageData.downloadArtifactLeases[String(downloadId)],
    ).toMatchObject({ artifact });

    emitDownloadState(downloadId, "complete");
    await vi.waitFor(() =>
      expect(
        testState.storageData.downloadArtifactLeases[String(downloadId)],
      ).toBeUndefined(),
    );
    expect(revokeObjectURL).toHaveBeenCalledWith(artifact.url);
    await expectExportMissing(artifact.exportId);
  });

  it("keeps a shared export until the last duplicate save completes", async () => {
    const artifact: PreparedDownload = {
      url: "blob:shared",
      exportId: "shared.mp4",
      mime: "video/mp4",
      size: 1,
    };
    await writeExport(artifact.exportId, [1]);
    const firstId = await IndexedDBFS.saveAs("first.mp4", artifact, {
      dialog: false,
    });
    const secondId = await IndexedDBFS.saveAs("second.mp4", artifact, {
      dialog: false,
    });

    emitDownloadState(firstId, "complete");
    await vi.waitFor(() =>
      expect(
        testState.storageData.downloadArtifactLeases[String(firstId)],
      ).toBeUndefined(),
    );
    expect(revokeObjectURL).not.toHaveBeenCalledWith(artifact.url);
    expect(await getExportHandle(artifact.exportId, false)).toBeDefined();

    emitDownloadState(secondId, "interrupted");
    await vi.waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith(artifact.url),
    );
    await expectExportMissing(artifact.exportId);
  });

  it("releases an artifact when the Downloads API rejects it", async () => {
    const artifact: PreparedDownload = {
      url: "blob:failed",
      exportId: "failed.mp4",
      mime: "video/mp4",
      size: 1,
    };
    await writeExport(artifact.exportId, [1]);
    const { downloads } = (await vi.importMock("webextension-polyfill")) as any;
    downloads.download.mockRejectedValueOnce(new Error("Denied"));

    await expect(
      IndexedDBFS.saveAs("failed.mp4", artifact, { dialog: false }),
    ).rejects.toThrow("Denied");
    expect(revokeObjectURL).toHaveBeenCalledWith(artifact.url);
    await expectExportMissing(artifact.exportId);
  });
});
