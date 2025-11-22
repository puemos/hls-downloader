import {
  openDB,
  deleteDB,
  DBSchema,
  IDBPDatabase,
  IDBPCursorWithValue,
} from "idb";

import { Bucket, IFS } from "@hls-downloader/core/lib/services";
import browser from "webextension-polyfill";
import filenamify from "filenamify";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const buckets: Record<string, IndexedDBBucket> = {};
const chromeApi = (globalThis as any).chrome;
const browserApi = (browser as any) ?? (globalThis as any).browser ?? chromeApi;
const BUCKET_META_KEY = "bucketMeta";

type BucketMeta = {
  videoLength: number;
  audioLength: number;
};

let bucketMetaCache: Record<string, BucketMeta> | null = null;

async function loadBucketMetaCache(): Promise<Record<string, BucketMeta>> {
  if (bucketMetaCache) {
    return bucketMetaCache;
  }

  const storageArea = getStorageArea();
  const res = storageArea ? await storageArea.get(BUCKET_META_KEY) : {};
  const meta = (res[BUCKET_META_KEY] as Record<string, BucketMeta>) || {};
  bucketMetaCache = meta;
  return meta;
}

async function setBucketMeta(id: string, meta: BucketMeta) {
  const cache = await loadBucketMetaCache();
  cache[id] = meta;
  bucketMetaCache = cache;
  const storageArea = getStorageArea();
  if (storageArea) {
    await storageArea.set({ [BUCKET_META_KEY]: cache });
  }
}

async function deleteBucketMeta(id: string) {
  const cache = await loadBucketMetaCache();
  delete cache[id];
  bucketMetaCache = cache;
  const storageArea = getStorageArea();
  if (storageArea) {
    await storageArea.set({ [BUCKET_META_KEY]: cache });
  }
}

async function getBucketMeta(id: string): Promise<BucketMeta | undefined> {
  const cache = await loadBucketMetaCache();
  return cache[id];
}

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

// Singleton FFmpeg instance
class FFmpegSingleton {
  private static instance: FFmpeg | null = null;
  private static isLoaded = false;

  static async getInstance(): Promise<FFmpeg> {
    if (!FFmpegSingleton.instance) {
      FFmpegSingleton.instance = new FFmpeg();

      const baseURL = "/assets/ffmpeg";
      await FFmpegSingleton.instance.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });

      FFmpegSingleton.isLoaded = true;
    }

    return FFmpegSingleton.instance;
  }

  static isFFmpegLoaded(): boolean {
    return FFmpegSingleton.isLoaded;
  }
}

export class IndexedDBBucket implements Bucket {
  // make output name unique per bucket
  readonly fileName: string;
  readonly objectStoreName = "chunks";
  private db?: IDBPDatabase<ChunksDB>;
  private isDeleted = false;

  constructor(
    readonly videoLength: number,
    readonly audioLength: number,
    readonly id: string
  ) {
    this.fileName = (filenamify(id) ?? "file").normalize("NFC");
  }

  async cleanup() {
    await this.deleteDB();
    try {
      const ffmpeg = await FFmpegSingleton.getInstance();
      await ffmpeg.deleteFile(`${this.fileName}.mp4`);
    } catch (error) {
      // File may not exist, ignore error
    }
    return;
  }

  async deleteDB() {
    if (!this.db && !this.isDeleted) {
      await this.openDB();
    }
    if (!this.db) {
      throw Error();
    }
    this.db.close();
    this.db = undefined;
    this.isDeleted = true;
    await deleteDB(this.id);
    return;
  }

  async openDB() {
    if (this.isDeleted) {
      throw Error();
    }
    const objectStoreName = this.objectStoreName;
    const db = await openDB<ChunksDB>(this.id, 1, {
      upgrade(db) {
        const store = db.createObjectStore(objectStoreName, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("index", "index", { unique: true });
      },
    });

    this.db = db;
  }

  private async ensureDb() {
    if (this.isDeleted) {
      throw Error();
    }
    if (!this.db) {
      await this.openDB();
    }
  }

  async write(index: number, data: ArrayBuffer): Promise<void> {
    const typedArray = new Uint8Array(data);

    await this.ensureDb();
    await this.db!.add(this.objectStoreName, {
      data: typedArray,
      index,
    });
    return Promise.resolve();
  }

  async stream() {
    await this.ensureDb();
    const store = this.db
      .transaction(this.objectStoreName)
      .objectStore(this.objectStoreName);

    const index = store.index("index");
    let cursor = await index.openCursor();
    let first = true;
    return new ReadableStream(
      {
        pull: (controller) => {
          async function push(
            currentCursor: IDBPCursorWithValue<
              ChunksDB,
              ["chunks"],
              "chunks",
              unknown
            > | null
          ) {
            if (!currentCursor) {
              controller.close();
            } else {
              controller.enqueue(currentCursor.value.data);
              const nextCursor = await currentCursor.continue();
              push(nextCursor);
            }
          }
          if (first) {
            push(cursor);
            first = false;
          }
        },
      },
      {}
    );
  }

  async getLink(
    onProgress?: (progress: number, message: string) => void
  ): Promise<string> {
    await this.ensureDb();

    if (shouldUseOffscreen()) {
      return await requestObjectUrlOffscreen(
        {
          bucketId: this.id,
          videoLength: this.videoLength,
          audioLength: this.audioLength,
        },
        onProgress
      );
    }

    try {
      const mp4Blob = await this.streamToMp4Blob(onProgress);
      const url = URL.createObjectURL(mp4Blob);
      return url;
    } catch (error) {
      console.error("getLink failed:", error);
      // Bubble up so caller can react
      throw error;
    }
  }

  private async streamToMp4Blob(
    onProgress?: (progress: number, message: string) => void
  ) {
    await this.ensureDb();

    const ffmpeg = await FFmpegSingleton.getInstance();

    ffmpeg.on("log", ({ message }) => console.log(message));

    // write somewhere predictable
    const outputFileName = `/tmp/${this.fileName}.mp4`;

    // Process based on available streams
    if (this.videoLength > 0 && this.audioLength > 0) {
      await this.processVideoAndAudio(ffmpeg, outputFileName, onProgress);
    } else if (this.videoLength > 0) {
      await this.processVideoOnly(ffmpeg, outputFileName, onProgress);
    } else {
      await this.processAudioOnly(ffmpeg, outputFileName, onProgress);
    }

    // Check if the output file exists before trying to read it
    try {
      const data = await ffmpeg.readFile(outputFileName);
      onProgress?.(1, "Done");
      return new Blob([data], { type: "video/mp4" });
    } catch (error) {
      console.error(`Failed to read output file ${outputFileName}:`, error);
      throw new Error(
        `Output file ${outputFileName} was not created by FFmpeg`
      );
    }
  }

  // Helper function to read chunks by index to avoid transaction timeout
  private async readChunkByIndex(
    chunkIndex: number
  ): Promise<Uint8Array | null> {
    const transaction = this.db!.transaction(this.objectStoreName, "readonly");
    const store = transaction.objectStore(this.objectStoreName);
    const index = store.index("index");

    try {
      const result = await index.get(chunkIndex);
      return result ? result.data : null;
    } catch (error) {
      console.error(`Error reading chunk ${chunkIndex}:`, error);
      return null;
    }
  }

  // Helper function to concatenate chunks using streams
  private async concatenateChunks(
    startIndex: number,
    length: number
  ): Promise<Blob> {
    const chunks: Uint8Array[] = [];

    for (let i = 0; i < length; i++) {
      const chunk = await this.readChunkByIndex(startIndex + i);
      if (chunk) {
        chunks.push(chunk);
      }
    }

    return new Blob(chunks);
  }

  private async processVideoAndAudio(
    ffmpeg: FFmpeg,
    outputFileName: string,
    onProgress?: (progress: number, message: string) => void
  ) {
    onProgress?.(0.1, "Concatenating video chunks");
    const videoBlob = await this.concatenateChunks(0, this.videoLength);

    onProgress?.(0.3, "Concatenating audio chunks");
    const audioBlob = await this.concatenateChunks(
      this.videoLength,
      this.audioLength
    );

    onProgress?.(0.5, "Writing video stream");
    await ffmpeg.writeFile("video.ts", await fetchFile(videoBlob));

    onProgress?.(0.6, "Writing audio stream");
    await ffmpeg.writeFile("audio.ts", await fetchFile(audioBlob));

    onProgress?.(0.7, "Merging video and audio");
    await ffmpeg.exec([
      "-y",
      "-i",
      "video.ts",
      "-i",
      "audio.ts",
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "-bsf:a",
      "aac_adtstoasc",
      "-shortest",
      "-movflags",
      "+faststart",
      outputFileName,
    ]);

    // Cleanup intermediate files
    try {
      await ffmpeg.deleteFile("video.ts");
      await ffmpeg.deleteFile("audio.ts");
    } catch (error) {
      // Files may not exist, ignore error
    }
  }

  private async processVideoOnly(
    ffmpeg: FFmpeg,
    outputFileName: string,
    onProgress?: (progress: number, message: string) => void
  ) {
    onProgress?.(0.2, "Concatenating video chunks");
    const videoBlob = await this.concatenateChunks(0, this.videoLength);

    onProgress?.(0.5, "Writing video stream");
    await ffmpeg.writeFile("video.ts", await fetchFile(videoBlob));

    onProgress?.(0.7, "Transcoding video");
    await ffmpeg.exec([
      "-y",
      "-i",
      "video.ts",
      "-c:v",
      "copy",
      "-movflags",
      "+faststart",
      outputFileName,
    ]);

    // Cleanup intermediate files
    try {
      await ffmpeg.deleteFile("video.ts");
    } catch (error) {
      // Files may not exist, ignore error
    }
  }

  private async processAudioOnly(
    ffmpeg: FFmpeg,
    outputFileName: string,
    onProgress?: (progress: number, message: string) => void
  ) {
    onProgress?.(0.2, "Concatenating audio chunks");
    const audioBlob = await this.concatenateChunks(
      this.videoLength,
      this.audioLength
    );

    onProgress?.(0.5, "Writing audio stream");
    await ffmpeg.writeFile("audio.ts", await fetchFile(audioBlob));

    onProgress?.(0.7, "Transcoding audio");
    await ffmpeg.exec([
      "-y",
      "-i",
      "audio.ts",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-af",
      "aresample=async=1:first_pts=0",
      "-movflags",
      "+faststart",
      outputFileName,
    ]);

    // Cleanup intermediate files
    try {
      await ffmpeg.deleteFile("audio.ts");
    } catch (error) {
      // Files may not exist, ignore error
    }
  }
}

const cleanup: IFS["cleanup"] = async function () {
  const meta = await loadBucketMetaCache();
  const dbNames = Object.keys(meta);

  for (const dbName of dbNames) {
    const db = await openDB(dbName, 1);
    db.close();
    await deleteDB(dbName);
  }

  bucketMetaCache = {};
  const storageArea = getStorageArea();
  if (storageArea) {
    await storageArea.set({ [BUCKET_META_KEY]: {} });
  }
  for (const id of Object.keys(buckets)) {
    delete buckets[id];
  }
};

const createBucket: IFS["createBucket"] = async function (
  id: string,
  videoLength: number,
  audioLength: number
) {
  await setBucketMeta(id, { videoLength, audioLength });
  buckets[id] = new IndexedDBBucket(videoLength, audioLength, id);
  return Promise.resolve();
};

const deleteBucket: IFS["deleteBucket"] = async function (id: string) {
  const bucket = await getBucket(id);
  if (bucket) {
    await bucket.deleteDB();
  }
  delete buckets[id];
  await deleteBucketMeta(id);
  return Promise.resolve();
};

const getBucket: IFS["getBucket"] = async function (id: string) {
  if (buckets[id]) {
    return buckets[id];
  }

  const meta = await getBucketMeta(id);
  if (!meta) {
    return;
  }

  const bucket = new IndexedDBBucket(meta.videoLength, meta.audioLength, id);
  buckets[id] = bucket;
  return bucket;
};

const saveAs: IFS["saveAs"] = async function (
  path: string,
  link: string,
  { dialog }
) {
  if (link === "") {
    return Promise.resolve();
  }
  const downloadsApi = getDownloadsApi();
  if (!downloadsApi?.download) {
    throw new Error("Downloads API unavailable");
  }
  const filename = filenamify(path ?? "stream.mp4").normalize("NFC");

  await downloadsApi.download({
    url: link,
    saveAs: dialog,
    conflictAction: "uniquify",
    filename,
  });
  // URL.revokeObjectURL(link);
  return Promise.resolve();
};

export const IndexedDBFS: IFS = {
  getBucket,
  createBucket,
  deleteBucket,
  saveAs,
  cleanup,
};

function shouldUseOffscreen() {
  return Boolean(
    chromeApi?.offscreen &&
      typeof chromeApi.offscreen.createDocument === "function" &&
      typeof document === "undefined"
  );
}

async function ensureOffscreenDocument() {
  if (!chromeApi?.offscreen?.createDocument) {
    return;
  }

  const hasDocument = await chromeApi.offscreen.hasDocument?.();
  if (hasDocument) {
    return;
  }

  await chromeApi.offscreen.createDocument({
    url: "offscreen.html",
    reasons: [chromeApi.offscreen.Reason.BLOBS],
    justification: "Create object URLs for download blobs",
  });
}

async function requestObjectUrlOffscreen(
  payload: { bucketId: string; videoLength: number; audioLength: number },
  onProgress?: (progress: number, message: string) => void
) {
  await ensureOffscreenDocument();

  const requestId =
    crypto.randomUUID?.() ??
    `req-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const progressListener = (message: any) => {
    if (
      message?.target === "background" &&
      message.type === "offscreen-progress" &&
      message.requestId === requestId
    ) {
      onProgress?.(message.progress, message.message);
    }
  };

  chromeApi?.runtime?.onMessage?.addListener(progressListener);

  return await new Promise<string>((resolve, reject) => {
    chromeApi.runtime.sendMessage(
      {
        target: "offscreen",
        type: "create-object-url",
        bucketId: payload.bucketId,
        videoLength: payload.videoLength,
        audioLength: payload.audioLength,
        requestId,
      },
      (response: { ok: boolean; url?: string; message?: string }) => {
        chromeApi?.runtime?.onMessage?.removeListener(progressListener);
        const lastError = chromeApi?.runtime?.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        if (!response?.ok || !response.url) {
          reject(new Error(response?.message || "Failed to create object URL"));
          return;
        }
        resolve(response.url);
      }
    );
  });
}

function getStorageArea() {
  return browserApi?.storage?.local ?? chromeApi?.storage?.local;
}

function getDownloadsApi() {
  return browserApi?.downloads ?? chromeApi?.downloads;
}
