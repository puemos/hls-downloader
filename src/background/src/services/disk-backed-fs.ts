import {
  openDB,
  deleteDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPCursorWithValue,
} from "idb";
import type {
  Bucket,
  IFS,
  PreparedDownload,
  PrepareDownloadOptions,
  StorageSnapshot,
} from "@hls-downloader/core/lib/services";
import type { OutputContainer } from "@hls-downloader/core/lib/entities";
import browser from "webextension-polyfill";
import filenamify from "filenamify";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import ffmpegClassWorkerPath from "@ffmpeg/ffmpeg/worker?worker&url";
import {
  detectFmp4,
  muxExec,
  writeMediaToFFmpegFS,
  type MediaContainer,
} from "./ffmpeg-muxer";
import { cancelDiskBackedMux, muxDiskBackedMedia } from "./disk-mux-client";
import {
  LEGACY_BACKEND,
  OPFS_BACKEND,
  clearAllJobStorage,
  deleteExportFile,
  deleteJobStorage,
  getExportFile,
  initializeJobStorage,
  listExportIds,
  measureJobStorage,
  writeFragmentFile,
  type BucketBackend,
} from "./opfs-storage";

const chromeApi = (globalThis as any).chrome;
const browserApi = (browser as any) ?? (globalThis as any).browser ?? chromeApi;
const BUCKET_META_KEY = "bucketMeta";
const DOWNLOAD_LEASES_KEY = "downloadArtifactLeases";
const SUBTITLE_DB_NAME = "subtitles";
const SUBTITLE_STORE_NAME = "subtitles";
const CHUNKS_STORE_NAME = "chunks";
const MINIMUM_FREE_MARGIN = 256 * 1024 * 1024;

type OutputOptions = NonNullable<PrepareDownloadOptions["container"]>;

export type BucketMeta = {
  backend?: BucketBackend;
  storageKey?: string;
  videoLength: number;
  audioLength: number;
  bytesWritten?: number;
  storedChunks?: number;
  updatedAt?: number;
};

export type PrepareDownloadPayload = {
  bucketId: string;
  backend: BucketBackend;
  storageKey?: string;
  videoLength: number;
  audioLength: number;
  container: OutputContainer;
};

type ManagedBucket = Bucket & {
  readonly backend: BucketBackend;
  deleteStorage(): Promise<void>;
};

type FFmpegInput = {
  fileName: string;
  container: MediaContainer;
  cleanupFileNames: string[];
};

type DownloadLease = {
  downloadId: number;
  artifact: PreparedDownload;
  createdAt: number;
};

interface ChunksDB extends DBSchema {
  chunks: {
    value: {
      data: Uint8Array;
      index: number;
    };
    key: number;
    indexes: { index: number };
  };
}

type SubtitleRecord = {
  id: string;
  text: string;
  language?: string;
  name?: string;
};

interface SubtitlesDB extends DBSchema {
  subtitles: {
    key: string;
    value: SubtitleRecord;
  };
}

const buckets: Record<string, ManagedBucket> = {};
const fragmentWriteQueues = new Map<string, Promise<void>>();
const pendingJobWrites = new Map<string, Set<Promise<void>>>();
const deletedStorageKeys = new Set<string>();
const artifactUrls = new Map<string, string>();
let bucketMetaCache: Record<string, BucketMeta> | null = null;
let bucketMetaMutationQueue: Promise<void> = Promise.resolve();
let subtitlesDbPromise: Promise<IDBPDatabase<SubtitlesDB>> | null = null;
let leaseCache: Record<string, DownloadLease> | null = null;
let leaseMutationQueue: Promise<void> = Promise.resolve();
let downloadListenerInstalled = false;
let offscreenCreation: Promise<void> | null = null;
let storagePolicyOwner: any;
let storagePolicyPromise: Promise<boolean | undefined> | null = null;

function randomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
  );
}

function getStorageArea(): any {
  return browserApi?.storage?.local ?? chromeApi?.storage?.local;
}

function getDownloadsApi(): any {
  return browserApi?.downloads ?? chromeApi?.downloads;
}

function hasUnlimitedStoragePermission(): boolean {
  try {
    const runtime = browserApi?.runtime ?? chromeApi?.runtime;
    const manifest = runtime?.getManifest?.();
    return (manifest?.permissions ?? []).includes("unlimitedStorage");
  } catch (_error) {
    return false;
  }
}

function isFirefoxRuntime(): boolean {
  const rawBrowser = (globalThis as any).browser;
  return (
    typeof rawBrowser?.runtime?.getBrowserInfo === "function" ||
    /Firefox\//i.test(globalThis.navigator?.userAgent ?? "")
  );
}

function setStoragePolicyOwner(storage: any): void {
  if (storagePolicyOwner !== storage) {
    storagePolicyOwner = storage;
    storagePolicyPromise = null;
  }
}

export function initializeStoragePolicy(): Promise<boolean | undefined> {
  const storage = globalThis.navigator?.storage as any;
  if (!storage) {
    return Promise.resolve(undefined);
  }
  setStoragePolicyOwner(storage);
  if (storagePolicyPromise) {
    return storagePolicyPromise;
  }

  storagePolicyPromise = (async () => {
    let persisted: boolean | undefined;
    if (typeof storage.persisted === "function") {
      try {
        persisted = await storage.persisted();
      } catch (error) {
        console.warn("[storage] navigator.storage.persisted failed", error);
      }
    }
    if (persisted === true || typeof storage.persist !== "function") {
      return persisted;
    }
    try {
      return await storage.persist();
    } catch (error) {
      console.warn("[storage] navigator.storage.persist failed", error);
      return persisted;
    }
  })();
  return storagePolicyPromise;
}

async function getStoragePersistenceStatus(): Promise<boolean | undefined> {
  const storage = globalThis.navigator?.storage as any;
  if (!storage) {
    return undefined;
  }
  setStoragePolicyOwner(storage);
  if (storagePolicyPromise) {
    return await storagePolicyPromise;
  }
  if (typeof storage.persisted !== "function") {
    return undefined;
  }
  try {
    return await storage.persisted();
  } catch (error) {
    console.warn("[storage] navigator.storage.persisted failed", error);
    return undefined;
  }
}

function getExtensionURL(path: string): string {
  if (/^(blob:|data:|https?:|moz-extension:|chrome-extension:)/.test(path)) {
    return path;
  }
  const runtime = browserApi?.runtime ?? chromeApi?.runtime;
  if (runtime?.getURL) {
    return runtime.getURL(path.replace(/^\/+/, ""));
  }
  return new URL(path, globalThis.location?.href ?? "http://localhost").href;
}

async function loadBucketMetaCache(): Promise<Record<string, BucketMeta>> {
  if (bucketMetaCache) {
    return bucketMetaCache;
  }
  const storageArea = getStorageArea();
  const result = storageArea ? await storageArea.get(BUCKET_META_KEY) : {};
  bucketMetaCache =
    (result?.[BUCKET_META_KEY] as Record<string, BucketMeta>) ?? {};
  return bucketMetaCache;
}

async function mutateBucketMeta(
  mutate: (cache: Record<string, BucketMeta>) => void,
): Promise<void> {
  const operation = bucketMetaMutationQueue.then(async () => {
    const cache = { ...(await loadBucketMetaCache()) };
    mutate(cache);
    bucketMetaCache = cache;
    const storageArea = getStorageArea();
    if (storageArea) {
      await storageArea.set({ [BUCKET_META_KEY]: cache });
    }
  });
  bucketMetaMutationQueue = operation.catch(() => undefined);
  await operation;
}

async function setBucketMeta(id: string, meta: BucketMeta): Promise<void> {
  await mutateBucketMeta((cache) => {
    cache[id] = meta;
  });
}

async function updateBucketUsage(
  id: string,
  bytesDelta: number,
  chunksDelta: number,
): Promise<void> {
  await mutateBucketMeta((cache) => {
    const current = cache[id];
    if (!current) {
      throw new Error(`Bucket metadata for ${id} was not found`);
    }
    cache[id] = {
      ...current,
      bytesWritten: Math.max(0, (current.bytesWritten ?? 0) + bytesDelta),
      storedChunks: Math.max(0, (current.storedChunks ?? 0) + chunksDelta),
      updatedAt: Date.now(),
    };
  });
}

async function deleteBucketMeta(id: string): Promise<void> {
  await mutateBucketMeta((cache) => {
    delete cache[id];
  });
}

async function getBucketMeta(id: string): Promise<BucketMeta | undefined> {
  return (await loadBucketMetaCache())[id];
}

async function getSubtitlesDb(): Promise<IDBPDatabase<SubtitlesDB>> {
  if (!subtitlesDbPromise) {
    subtitlesDbPromise = openDB<SubtitlesDB>(SUBTITLE_DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(SUBTITLE_STORE_NAME, { keyPath: "id" });
      },
    });
  }
  return subtitlesDbPromise;
}

async function deleteSubtitlesDb(): Promise<void> {
  if (subtitlesDbPromise) {
    try {
      (await subtitlesDbPromise).close();
    } finally {
      subtitlesDbPromise = null;
    }
  }
  await deleteDB(SUBTITLE_DB_NAME);
}

export async function setSubtitleText(
  id: string,
  subtitle: { text: string; language?: string; name?: string },
): Promise<void> {
  const db = await getSubtitlesDb();
  await db.put(SUBTITLE_STORE_NAME, { ...subtitle, id });
}

export async function getSubtitleText(
  id: string,
): Promise<{ text: string; language?: string; name?: string } | undefined> {
  const db = await getSubtitlesDb();
  const record = await db.get(SUBTITLE_STORE_NAME, id);
  return record
    ? {
        text: record.text,
        language: record.language,
        name: record.name,
      }
    : undefined;
}

async function deleteSubtitleText(id: string): Promise<void> {
  const db = await getSubtitlesDb();
  await db.delete(SUBTITLE_STORE_NAME, id);
}

async function estimateSubtitlesBytes(): Promise<number> {
  try {
    const db = await getSubtitlesDb();
    const tx = db.transaction(SUBTITLE_STORE_NAME, "readonly");
    const encoder = new TextEncoder();
    let total = 0;
    let cursor = await tx.objectStore(SUBTITLE_STORE_NAME).openCursor();
    while (cursor) {
      const record = cursor.value;
      total += encoder.encode(record.text ?? "").byteLength;
      total += encoder.encode(record.language ?? "").byteLength;
      total += encoder.encode(record.name ?? "").byteLength;
      cursor = await cursor.continue();
    }
    await tx.done;
    return total;
  } catch (_error) {
    return 0;
  }
}

async function getStorageEstimate() {
  const storage = globalThis.navigator?.storage;
  const persisted = await getStoragePersistenceStatus();
  const quotaExempt = hasUnlimitedStoragePermission() && !isFirefoxRuntime();
  const policy = {
    persisted,
    quotaExempt,
    quotaIsAdvisory: quotaExempt || persisted === true,
  };
  if (storage?.estimate) {
    try {
      const estimate = await storage.estimate();
      const usage =
        typeof estimate.usage === "number" ? estimate.usage : undefined;
      const quota =
        typeof estimate.quota === "number" ? estimate.quota : undefined;
      return {
        usage,
        quota,
        available:
          usage !== undefined && quota !== undefined
            ? Math.max(0, quota - usage)
            : undefined,
        ...policy,
        source: "navigator" as const,
      };
    } catch (error) {
      console.warn("[storage] navigator.storage.estimate failed", error);
    }
  }
  return { ...policy, source: "fallback" as const };
}

async function measureLegacyBucketUsage(
  id: string,
): Promise<{ storedBytes: number; storedChunks: number }> {
  let db: IDBPDatabase<ChunksDB> | undefined;
  try {
    db = await openDB<ChunksDB>(id, 1);
    const tx = db.transaction(CHUNKS_STORE_NAME, "readonly");
    let cursor = await tx.objectStore(CHUNKS_STORE_NAME).openCursor();
    let storedBytes = 0;
    let storedChunks = 0;
    while (cursor) {
      storedBytes += cursor.value.data?.byteLength ?? 0;
      storedChunks++;
      cursor = await cursor.continue();
    }
    await tx.done;
    return { storedBytes, storedChunks };
  } catch (_error) {
    return { storedBytes: 0, storedChunks: 0 };
  } finally {
    db?.close();
  }
}

class FFmpegSingleton {
  private static instance: FFmpeg | null = null;

  static async getInstance(): Promise<FFmpeg> {
    if (!FFmpegSingleton.instance) {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: "/assets/ffmpeg/ffmpeg-core.js",
        wasmURL: "/assets/ffmpeg/ffmpeg-core.wasm",
        classWorkerURL: getExtensionURL(ffmpegClassWorkerPath),
      });
      FFmpegSingleton.instance = ffmpeg;
    }
    return FFmpegSingleton.instance;
  }

  static terminate(): void {
    FFmpegSingleton.instance?.terminate?.();
    FFmpegSingleton.instance = null;
  }
}

function createObjectURLArtifact(
  data: Blob,
  exportId: string,
  mime: string,
): PreparedDownload {
  const existingUrl = artifactUrls.get(exportId);
  if (existingUrl) {
    return { url: existingUrl, exportId, mime, size: data.size };
  }
  if (typeof URL?.createObjectURL !== "function") {
    throw new Error("Object URLs are unavailable in this browser context");
  }
  const url = URL.createObjectURL(data);
  artifactUrls.set(exportId, url);
  return { url, exportId, mime, size: data.size };
}

async function releaseArtifactLocal(artifact: PreparedDownload): Promise<void> {
  const url = artifactUrls.get(artifact.exportId) ?? artifact.url;
  if (url.startsWith("blob:") && typeof URL?.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
  artifactUrls.delete(artifact.exportId);
  if (!artifact.exportId.startsWith("legacy-")) {
    await deleteExportFile(artifact.exportId);
  }
}

export class IndexedDBBucket implements ManagedBucket {
  readonly backend = LEGACY_BACKEND;
  readonly objectStoreName = CHUNKS_STORE_NAME;
  readonly fileName: string;
  private db?: IDBPDatabase<ChunksDB>;
  private isDeleted = false;

  constructor(
    readonly videoLength: number,
    readonly audioLength: number,
    readonly id: string,
  ) {
    const base = id.endsWith(".mp4") ? id.slice(0, -4) : id;
    this.fileName = (filenamify(base) ?? "file").normalize("NFC");
  }

  async openDB(): Promise<void> {
    if (this.isDeleted) {
      throw new Error("Cannot open: bucket was deleted");
    }
    const objectStoreName = this.objectStoreName;
    this.db = await openDB<ChunksDB>(this.id, 1, {
      upgrade(db) {
        const store = db.createObjectStore(objectStoreName, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("index", "index", { unique: true });
      },
    });
  }

  private async ensureDb(): Promise<void> {
    if (this.isDeleted) {
      throw new Error("Cannot access: bucket was deleted");
    }
    if (!this.db) {
      await this.openDB();
    }
  }

  async deleteStorage(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
    this.isDeleted = true;
    await deleteDB(this.id);
  }

  async deleteDB(): Promise<void> {
    await this.deleteStorage();
  }

  async write(index: number, data: ArrayBuffer): Promise<void> {
    await this.ensureDb();
    await this.db!.add(this.objectStoreName, {
      data: new Uint8Array(data),
      index,
    });
    await updateBucketUsage(this.id, data.byteLength, 1);
  }

  async stream(): Promise<ReadableStream<Uint8Array>> {
    await this.ensureDb();
    const index = this.db!.transaction(this.objectStoreName)
      .objectStore(this.objectStoreName)
      .index("index");
    let cursor = await index.openCursor();
    let first = true;
    return new ReadableStream({
      pull(controller) {
        async function push(
          current: IDBPCursorWithValue<
            ChunksDB,
            ["chunks"],
            "chunks",
            unknown
          > | null,
        ) {
          if (!current) {
            controller.close();
            return;
          }
          controller.enqueue(current.value.data);
          await push(await current.continue());
        }
        if (first) {
          first = false;
          void push(cursor);
        }
      },
    });
  }

  async prepareDownload(
    onProgress?: (progress: number, message: string) => void,
    options: PrepareDownloadOptions = {},
  ): Promise<PreparedDownload> {
    await this.ensureDb();
    const payload: PrepareDownloadPayload = {
      bucketId: this.id,
      backend: LEGACY_BACKEND,
      videoLength: this.videoLength,
      audioLength: this.audioLength,
      container: options.container ?? "mp4",
    };
    if (shouldUseOffscreen()) {
      return await requestPrepareDownloadOffscreen(payload, onProgress);
    }
    return await this.prepareLegacyDownloadLocal(payload.container, onProgress);
  }

  async prepareLegacyDownloadLocal(
    container: OutputOptions,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<PreparedDownload> {
    onProgress?.(
      0,
      "Finalizing a legacy download; re-download if memory is insufficient",
    );
    const blob = await this.streamToMediaBlob(container, onProgress);
    return createObjectURLArtifact(
      blob,
      `legacy-${randomId()}`,
      blob.type || "video/mp4",
    );
  }

  private async streamToMediaBlob(
    container: OutputOptions,
    onProgress?: (progress: number, message: string) => void,
  ): Promise<Blob> {
    await this.ensureDb();
    const ffmpeg = await FFmpegSingleton.getInstance();
    const subtitle = await getSubtitleText(this.id);
    const outputContainer = subtitle !== undefined ? "mkv" : container;
    const outputFileName = `output.${outputContainer}`;
    let videoInput: FFmpegInput | undefined;
    let audioInput: FFmpegInput | undefined;

    try {
      if (this.videoLength > 0) {
        videoInput = await this.writeChunksToFFmpegInput(
          ffmpeg,
          "video",
          0,
          this.videoLength,
        );
      }
      if (this.audioLength > 0) {
        audioInput = await this.writeChunksToFFmpegInput(
          ffmpeg,
          "audio",
          this.videoLength,
          this.audioLength,
        );
      }
      const result = await muxExec({
        ffmpeg,
        outputFileName,
        hasVideo: this.videoLength > 0,
        hasAudio: this.audioLength > 0,
        videoFileName: videoInput?.fileName,
        audioFileName: audioInput?.fileName,
        videoContainer: videoInput?.container,
        audioContainer: audioInput?.container,
        cleanupFileNames: [
          ...(videoInput?.cleanupFileNames ?? []),
          ...(audioInput?.cleanupFileNames ?? []),
        ],
        subtitleText: subtitle?.text,
        subtitleLanguage: subtitle?.language,
      });
      onProgress?.(1, "Ready to download");
      return result.blob;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Legacy muxing failed: ${detail}. Re-download this item with the current extension version.`,
      );
    }
  }

  private async readChunkByIndex(
    chunkIndex: number,
  ): Promise<Uint8Array | null> {
    const tx = this.db!.transaction(this.objectStoreName, "readonly");
    const result = await tx
      .objectStore(this.objectStoreName)
      .index("index")
      .get(chunkIndex);
    return result?.data ?? null;
  }

  private async writeChunksToFFmpegInput(
    ffmpeg: FFmpeg,
    prefix: "video" | "audio",
    startIndex: number,
    length: number,
  ): Promise<FFmpegInput> {
    const chunkFiles: string[] = [];
    let container: MediaContainer | undefined;
    for (let index = 0; index < length; index++) {
      const chunk = await this.readChunkByIndex(startIndex + index);
      if (!chunk) {
        throw new Error(`Missing ${prefix} fragment ${index}`);
      }
      if (!container) {
        container = detectFmp4(chunk) ? "mp4" : "mpegts";
      }
      const extension = container === "mp4" ? "mp4" : "ts";
      const fileName =
        length === 1
          ? `${prefix}.${extension}`
          : `${prefix}-${String(index).padStart(6, "0")}.${extension}`;
      await writeMediaToFFmpegFS(ffmpeg, fileName, chunk);
      chunkFiles.push(fileName);
    }
    if (!container || chunkFiles.length === 0) {
      throw new Error(`No ${prefix} fragments are available`);
    }
    if (chunkFiles.length === 1) {
      return {
        fileName: chunkFiles[0],
        container,
        cleanupFileNames: [],
      };
    }
    const listFileName = `${prefix}.concat.txt`;
    await ffmpeg.writeFile(
      listFileName,
      new TextEncoder().encode(`${chunkFiles.join("\n")}\n`),
    );
    return {
      fileName: `concatf:${listFileName}`,
      container,
      cleanupFileNames: [listFileName, ...chunkFiles],
    };
  }
}

export class OPFSBucket implements ManagedBucket {
  readonly backend = OPFS_BACKEND;
  private isDeleted = false;

  constructor(
    readonly videoLength: number,
    readonly audioLength: number,
    readonly id: string,
    readonly storageKey: string,
  ) {}

  async write(index: number, data: ArrayBuffer): Promise<void> {
    if (this.isDeleted || deletedStorageKeys.has(this.storageKey)) {
      throw new Error("Cannot write: bucket was deleted");
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`Invalid fragment index ${index}`);
    }
    const total = this.videoLength + this.audioLength;
    if (index >= total) {
      throw new Error(`Fragment index ${index} is outside bucket ${this.id}`);
    }
    const track = index < this.videoLength ? "video" : "audio";
    const localIndex = track === "video" ? index : index - this.videoLength;
    const queueKey = `${this.storageKey}:${track}:${localIndex}`;
    const previous = fragmentWriteQueues.get(queueKey) ?? Promise.resolve();
    const operation = previous.then(async () => {
      const result = await writeFragmentFile(
        this.storageKey,
        track,
        localIndex,
        data,
      );
      await updateBucketUsage(
        this.id,
        result.size - (result.previousSize ?? 0),
        result.previousSize === undefined ? 1 : 0,
      );
    });
    const queued = operation.catch(() => undefined);
    fragmentWriteQueues.set(queueKey, queued);
    trackJobWrite(this.storageKey, operation);
    try {
      await operation;
    } catch (error) {
      if ((error as DOMException)?.name === "QuotaExceededError") {
        throw new Error("Not enough disk space to store this fragment");
      }
      throw error;
    } finally {
      if (fragmentWriteQueues.get(queueKey) === queued) {
        fragmentWriteQueues.delete(queueKey);
      }
    }
  }

  async deleteStorage(): Promise<void> {
    this.isDeleted = true;
    await deleteOpfsStorageSafely(this.storageKey);
  }

  async prepareDownload(
    onProgress?: (progress: number, message: string) => void,
    options: PrepareDownloadOptions = {},
  ): Promise<PreparedDownload> {
    if (this.isDeleted || deletedStorageKeys.has(this.storageKey)) {
      throw new Error("Cannot finalize: bucket was deleted");
    }
    const meta = await getBucketMeta(this.id);
    if (!meta) {
      throw new Error(`Cannot finalize: metadata for ${this.id} was not found`);
    }
    const usage = await measureJobStorage(this.storageKey);
    const expectedChunks = this.videoLength + this.audioLength;
    if (usage.storedChunks !== expectedChunks) {
      throw new Error(
        `Cannot finalize: expected ${expectedChunks} fragments but found ${usage.storedChunks}. Re-download this item.`,
      );
    }
    await setBucketMeta(this.id, {
      ...meta,
      bytesWritten: usage.storedBytes,
      storedChunks: usage.storedChunks,
      updatedAt: Date.now(),
    });
    const storedBytes = usage.storedBytes;
    const estimate = await getStorageEstimate();
    const required =
      storedBytes + Math.max(MINIMUM_FREE_MARGIN, Math.ceil(storedBytes * 0.1));
    if (
      !estimate.quotaIsAdvisory &&
      estimate.available !== undefined &&
      estimate.available < required
    ) {
      throw new Error(
        `Not enough disk space to finalize this download. Free at least ${formatBytes(
          required - estimate.available,
        )} and try again.`,
      );
    }

    onProgress?.(0, "Checking disk-backed fragments");
    const payload: PrepareDownloadPayload = {
      bucketId: this.id,
      backend: OPFS_BACKEND,
      storageKey: this.storageKey,
      videoLength: this.videoLength,
      audioLength: this.audioLength,
      container: options.container ?? "mp4",
    };
    if (shouldUseOffscreen()) {
      return await requestPrepareDownloadOffscreen(payload, onProgress);
    }
    return await prepareDownloadInCurrentContext(payload, onProgress);
  }
}

function trackJobWrite(storageKey: string, operation: Promise<void>): void {
  const writes = pendingJobWrites.get(storageKey) ?? new Set<Promise<void>>();
  writes.add(operation);
  pendingJobWrites.set(storageKey, writes);
  const remove = () => {
    writes.delete(operation);
    if (writes.size === 0) {
      pendingJobWrites.delete(storageKey);
    }
  };
  void operation.then(remove, remove);
}

async function deleteOpfsStorageSafely(storageKey: string): Promise<void> {
  deletedStorageKeys.add(storageKey);
  try {
    await cancelDiskMuxForStorage(storageKey);
    const writes = pendingJobWrites.get(storageKey);
    if (writes?.size) {
      await Promise.allSettled([...writes]);
    }
    await deleteJobStorage(storageKey);
  } finally {
    deletedStorageKeys.delete(storageKey);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) {
    return `${Math.ceil(bytes / (1024 * 1024))} MiB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GiB`;
}

export async function prepareDownloadInCurrentContext(
  payload: PrepareDownloadPayload,
  onProgress?: (progress: number, message: string) => void,
): Promise<PreparedDownload> {
  if (payload.backend === LEGACY_BACKEND) {
    const bucket = new IndexedDBBucket(
      payload.videoLength,
      payload.audioLength,
      payload.bucketId,
    );
    return await bucket.prepareLegacyDownloadLocal(
      payload.container,
      onProgress,
    );
  }
  if (!payload.storageKey) {
    throw new Error("Disk-backed bucket metadata is incomplete");
  }

  const subtitle = await getSubtitleText(payload.bucketId);
  const result = await muxDiskBackedMedia(
    {
      storageKey: payload.storageKey,
      videoLength: payload.videoLength,
      audioLength: payload.audioLength,
      container: payload.container,
      subtitleText: subtitle?.text,
      subtitleLanguage: subtitle?.language,
    },
    onProgress,
  );

  try {
    const file = await getExportFile(result.exportId);
    return createObjectURLArtifact(file, result.exportId, result.mime);
  } catch (error) {
    await deleteExportFile(result.exportId).catch(() => undefined);
    throw error;
  }
}

export function prepareTextDownloadInCurrentContext(
  text: string,
  mime: string,
): PreparedDownload {
  const blob = new Blob([text], { type: mime });
  return createObjectURLArtifact(blob, `legacy-text-${randomId()}`, mime);
}

const cleanup: IFS["cleanup"] = async () => {
  const meta = await loadBucketMetaCache();
  for (const [id, bucketMeta] of Object.entries(meta)) {
    try {
      if (buckets[id]) {
        await buckets[id].deleteStorage();
      } else if (bucketMeta.backend === OPFS_BACKEND && bucketMeta.storageKey) {
        await deleteOpfsStorageSafely(bucketMeta.storageKey);
      } else {
        await deleteDB(id);
      }
    } catch (_error) {
      // Best effort per bucket.
    }
  }
  await clearAllJobStorage().catch(() => undefined);
  bucketMetaCache = {};
  const storageArea = getStorageArea();
  if (storageArea) {
    await storageArea.set({ [BUCKET_META_KEY]: {} });
  }
  for (const id of Object.keys(buckets)) {
    delete buckets[id];
  }
  FFmpegSingleton.terminate();
  await deleteSubtitlesDb();
};

const createBucket: IFS["createBucket"] = async (
  id,
  videoLength,
  audioLength,
) => {
  await initializeStoragePolicy();
  const previous = await getBucketMeta(id);
  if (buckets[id]) {
    await buckets[id].deleteStorage().catch(() => undefined);
    delete buckets[id];
  } else if (previous?.backend === OPFS_BACKEND && previous.storageKey) {
    await deleteOpfsStorageSafely(previous.storageKey).catch(() => undefined);
  } else if (previous) {
    await deleteDB(id).catch(() => undefined);
  }

  const storageKey = randomId();
  await initializeJobStorage(storageKey);
  try {
    await setBucketMeta(id, {
      backend: OPFS_BACKEND,
      storageKey,
      videoLength,
      audioLength,
      bytesWritten: 0,
      storedChunks: 0,
      updatedAt: Date.now(),
    });
  } catch (error) {
    await deleteJobStorage(storageKey).catch(() => undefined);
    throw error;
  }
  buckets[id] = new OPFSBucket(videoLength, audioLength, id, storageKey);
};

export async function createLegacyBucketForTests(
  id: string,
  videoLength: number,
  audioLength: number,
): Promise<IndexedDBBucket> {
  await setBucketMeta(id, {
    backend: LEGACY_BACKEND,
    videoLength,
    audioLength,
    bytesWritten: 0,
    storedChunks: 0,
    updatedAt: Date.now(),
  });
  const bucket = new IndexedDBBucket(videoLength, audioLength, id);
  buckets[id] = bucket;
  return bucket;
}

const deleteBucket: IFS["deleteBucket"] = async (id) => {
  const meta = await getBucketMeta(id);
  try {
    const bucket = buckets[id];
    if (bucket) {
      await bucket.deleteStorage();
    } else if (meta?.backend === OPFS_BACKEND && meta.storageKey) {
      await deleteOpfsStorageSafely(meta.storageKey);
    } else {
      await deleteDB(id);
    }
  } finally {
    delete buckets[id];
    await deleteBucketMeta(id).catch(() => undefined);
    await deleteSubtitleText(id).catch(() => undefined);
  }
};

const getBucket: IFS["getBucket"] = async (id) => {
  if (buckets[id]) {
    return buckets[id];
  }
  const meta = await getBucketMeta(id);
  if (!meta) {
    return undefined;
  }
  const bucket =
    meta.backend === OPFS_BACKEND && meta.storageKey
      ? new OPFSBucket(meta.videoLength, meta.audioLength, id, meta.storageKey)
      : new IndexedDBBucket(meta.videoLength, meta.audioLength, id);
  buckets[id] = bucket;
  return bucket;
};

const getStorageStats: IFS["getStorageStats"] = async () => {
  const meta = await loadBucketMetaCache();
  const bucketStats: StorageSnapshot["buckets"] = [];
  for (const [id, bucketMeta] of Object.entries(meta)) {
    let storedBytes = bucketMeta.bytesWritten;
    let storedChunks = bucketMeta.storedChunks;
    if (storedBytes === undefined || storedChunks === undefined) {
      const measured =
        bucketMeta.backend === OPFS_BACKEND && bucketMeta.storageKey
          ? await measureJobStorage(bucketMeta.storageKey)
          : await measureLegacyBucketUsage(id);
      storedBytes = measured.storedBytes;
      storedChunks = measured.storedChunks;
      await setBucketMeta(id, {
        ...bucketMeta,
        bytesWritten: storedBytes,
        storedChunks,
        updatedAt: Date.now(),
      });
    }
    bucketStats.push({
      id,
      videoLength: bucketMeta.videoLength,
      audioLength: bucketMeta.audioLength,
      storedBytes,
      storedChunks,
      updatedAt: bucketMeta.updatedAt,
    });
  }
  return {
    buckets: bucketStats,
    subtitlesBytes: await estimateSubtitlesBytes(),
    estimate: await getStorageEstimate(),
  };
};

async function loadLeaseCache(): Promise<Record<string, DownloadLease>> {
  if (leaseCache) {
    return leaseCache;
  }
  const storageArea = getStorageArea();
  const result = storageArea ? await storageArea.get(DOWNLOAD_LEASES_KEY) : {};
  leaseCache =
    (result?.[DOWNLOAD_LEASES_KEY] as Record<string, DownloadLease>) ?? {};
  return leaseCache;
}

async function mutateLeases(
  mutate: (cache: Record<string, DownloadLease>) => void,
): Promise<void> {
  const operation = leaseMutationQueue.then(async () => {
    const cache = { ...(await loadLeaseCache()) };
    mutate(cache);
    leaseCache = cache;
    const storageArea = getStorageArea();
    if (storageArea) {
      await storageArea.set({ [DOWNLOAD_LEASES_KEY]: cache });
    }
  });
  leaseMutationQueue = operation.catch(() => undefined);
  await operation;
}

async function releaseArtifact(artifact: PreparedDownload): Promise<void> {
  if (shouldUseOffscreen()) {
    await requestReleaseArtifactOffscreen(artifact);
  } else {
    await releaseArtifactLocal(artifact);
  }
}

async function completeLease(downloadId: number): Promise<void> {
  let artifact: PreparedDownload | undefined;
  let hasOtherLease = false;
  await mutateLeases((cache) => {
    const lease = cache[String(downloadId)];
    if (!lease) return;
    artifact = lease.artifact;
    delete cache[String(downloadId)];
    hasOtherLease = Object.values(cache).some(
      (candidate) => candidate.artifact.exportId === lease.artifact.exportId,
    );
  });
  if (artifact && !hasOtherLease) {
    await releaseArtifact(artifact);
  }
}

function installDownloadListener(): void {
  if (downloadListenerInstalled) return;
  const downloadsApi = getDownloadsApi();
  if (!downloadsApi?.onChanged?.addListener) return;
  downloadsApi.onChanged.addListener(
    (delta: { id: number; state?: { current: string } }) => {
      const state = delta.state?.current;
      if (state === "complete" || state === "interrupted") {
        void completeLease(delta.id).catch((error) => {
          console.warn("[downloads] failed to release artifact", error);
        });
      }
    },
  );
  downloadListenerInstalled = true;
}

const saveAs: IFS["saveAs"] = async (
  path,
  download,
  { dialog },
): Promise<number> => {
  const downloadsApi = getDownloadsApi();
  if (!downloadsApi?.download) {
    await releaseArtifact(download).catch(() => undefined);
    throw new Error("Downloads API unavailable");
  }
  installDownloadListener();
  const filename = filenamify(path ?? "stream.mp4").normalize("NFC");
  let downloadId: number;
  try {
    downloadId = await downloadsApi.download({
      url: download.url,
      saveAs: dialog,
      conflictAction: "uniquify",
      filename,
    });
  } catch (error) {
    await releaseArtifact(download).catch(() => undefined);
    throw error;
  }
  await mutateLeases((cache) => {
    cache[String(downloadId)] = {
      downloadId,
      artifact: download,
      createdAt: Date.now(),
    };
  });

  if (downloadsApi.search) {
    const matches = await downloadsApi.search({ id: downloadId });
    const state = matches?.[0]?.state;
    if (state === "complete" || state === "interrupted") {
      await completeLease(downloadId);
    }
  }
  return downloadId;
};

const prepareTextDownload: IFS["prepareTextDownload"] = async (text, mime) => {
  if (shouldUseOffscreen()) {
    return await requestPrepareTextDownloadOffscreen(text, mime);
  }
  return prepareTextDownloadInCurrentContext(text, mime);
};

export async function initializeDownloadTracking(): Promise<void> {
  installDownloadListener();
  const downloadsApi = getDownloadsApi();
  const leases = await loadLeaseCache();
  for (const lease of Object.values(leases)) {
    if (!downloadsApi?.search) continue;
    try {
      const matches = await downloadsApi.search({ id: lease.downloadId });
      const state = matches?.[0]?.state;
      if (!matches?.length || state === "complete" || state === "interrupted") {
        await completeLease(lease.downloadId);
      }
    } catch (_error) {
      // Keep the lease for the next browser wake-up.
    }
  }

  const activeExportIds = new Set(
    Object.values(await loadLeaseCache()).map(
      (lease) => lease.artifact.exportId,
    ),
  );
  for (const exportId of await listExportIds().catch(() => [])) {
    if (!activeExportIds.has(exportId)) {
      await deleteExportFile(exportId).catch(() => undefined);
    }
  }
}

export const DiskBackedFS: IFS = {
  getBucket,
  createBucket,
  deleteBucket,
  getStorageStats,
  saveAs,
  cleanup,
  setSubtitleText,
  getSubtitleText,
  prepareTextDownload,
};

export const IndexedDBFS = DiskBackedFS;

function shouldUseOffscreen(): boolean {
  return Boolean(
    chromeApi?.offscreen?.createDocument && typeof document === "undefined",
  );
}

async function offscreenDocumentExists(): Promise<boolean> {
  const runtime = chromeApi?.runtime;
  const offscreenURL = runtime?.getURL?.("offscreen.html");
  if (runtime?.getContexts) {
    const contexts = await runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: offscreenURL ? [offscreenURL] : undefined,
    });
    return contexts.length > 0;
  }
  const workerClients = (globalThis as any).clients;
  if (workerClients?.matchAll && offscreenURL) {
    const clients = await workerClients.matchAll();
    return clients.some(
      (client: { url?: string }) => client.url === offscreenURL,
    );
  }
  return false;
}

async function ensureOffscreenDocument(): Promise<void> {
  if (!chromeApi?.offscreen?.createDocument) {
    throw new Error("Chromium offscreen document support is unavailable");
  }
  if (await offscreenDocumentExists()) {
    return;
  }
  if (!offscreenCreation) {
    const reasons = [chromeApi.offscreen.Reason?.BLOBS ?? "BLOBS"];
    offscreenCreation = chromeApi.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons,
        justification:
          "Mux disk-backed media in a worker and create its download URL",
      })
      .catch((error: Error) => {
        if (!/single offscreen|already exists/i.test(error.message)) {
          throw error;
        }
      })
      .finally(() => {
        offscreenCreation = null;
      });
  }
  await offscreenCreation;
}

function sendChromeMessage<T>(message: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chromeApi.runtime.sendMessage(message, (response: T) => {
      const lastError = chromeApi.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function requestPrepareDownloadOffscreen(
  payload: PrepareDownloadPayload,
  onProgress?: (progress: number, message: string) => void,
): Promise<PreparedDownload> {
  await ensureOffscreenDocument();
  const requestId = randomId();
  const progressListener = (message: any) => {
    if (
      message?.target === "background" &&
      message.type === "offscreen-progress" &&
      message.requestId === requestId
    ) {
      onProgress?.(message.progress, message.message);
    }
  };
  chromeApi.runtime.onMessage.addListener(progressListener);
  try {
    const response = await sendChromeMessage<
      { ok: true; download: PreparedDownload } | { ok: false; message: string }
    >({
      target: "offscreen",
      type: "prepare-download",
      requestId,
      payload,
    });
    if (!response?.ok) {
      throw new Error(response?.message || "Failed to prepare download");
    }
    return response.download;
  } finally {
    chromeApi.runtime.onMessage.removeListener(progressListener);
  }
}

async function requestPrepareTextDownloadOffscreen(
  text: string,
  mime: string,
): Promise<PreparedDownload> {
  await ensureOffscreenDocument();
  const response = await sendChromeMessage<
    { ok: true; download: PreparedDownload } | { ok: false; message: string }
  >({
    target: "offscreen",
    type: "prepare-text-download",
    text,
    mime,
  });
  if (!response?.ok) {
    throw new Error(response?.message || "Failed to prepare text download");
  }
  return response.download;
}

async function requestReleaseArtifactOffscreen(
  artifact: PreparedDownload,
): Promise<void> {
  await ensureOffscreenDocument();
  const response = await sendChromeMessage<
    { ok: true } | { ok: false; message: string }
  >({
    target: "offscreen",
    type: "release-artifact",
    artifact,
  });
  if (!response?.ok) {
    throw new Error(response?.message || "Failed to release download artifact");
  }
}

async function cancelDiskMuxForStorage(storageKey: string): Promise<void> {
  if (shouldUseOffscreen() && (await offscreenDocumentExists())) {
    const response = await sendChromeMessage<
      { ok: true } | { ok: false; message: string }
    >({
      target: "offscreen",
      type: "cancel-mux",
      storageKey,
    });
    if (!response?.ok) {
      throw new Error(response?.message || "Failed to cancel finalization");
    }
    return;
  }
  await cancelDiskBackedMux(storageKey);
}

export async function releaseArtifactInCurrentContext(
  artifact: PreparedDownload,
): Promise<void> {
  await releaseArtifactLocal(artifact);
}
