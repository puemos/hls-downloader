import {
  openDB,
  deleteDB,
  DBSchema,
  IDBPDatabase,
  IDBPCursorWithValue,
} from "idb";

import { Bucket, IFS } from "@hls-downloader/core/lib/services";
import { downloads } from "webextension-polyfill";
import filenamify from "filenamify";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const buckets: Record<string, IndexedDBBucket> = {};

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

const storageManager = (function () {
  let storage = {};

  return {
    setItem: function (key: string | number, value: any) {
      storage[key] = JSON.stringify(value);
    },

    getItem: function (key: string | number) {
      const value = storage[key];
      return value ? JSON.parse(value) : null;
    },

    removeItem: function (key: string | number) {
      delete storage[key];
    },

    clear: function () {
      storage = {};
    },
  };
})();

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
    if (!this.db) {
      throw Error();
    }
    this.db.close();
    this.db = undefined;
    await deleteDB(this.id);
    return;
  }

  async openDB() {
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

  async write(index: number, data: ArrayBuffer): Promise<void> {
    const typedArray = new Uint8Array(data);

    if (!this.db) {
      await this.openDB();
    }
    await this.db!.add(this.objectStoreName, {
      data: typedArray,
      index,
    });
    return Promise.resolve();
  }

  async stream() {
    if (!this.db) {
      throw Error();
    }
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
    if (!this.db) {
      throw Error();
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
    if (!this.db) {
      throw Error();
    }

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
  const dbsString = storageManager.getItem("dbs");
  if (!dbsString) {
    return;
  }

  const dbNames: string[] = JSON.parse(dbsString);
  for (const dbName of dbNames) {
    const db = await openDB(dbName, 1);
    db.close();
    await deleteDB(dbName);
  }
};

const createBucket: IFS["createBucket"] = async function (
  id: string,
  videoLength: number,
  audioLength: number
) {
  buckets[id] = new IndexedDBBucket(videoLength, audioLength, id);

  storageManager.setItem("dbs", JSON.stringify(Object.keys(buckets)));
  return Promise.resolve();
};

const deleteBucket: IFS["deleteBucket"] = async function (id: string) {
  await buckets[id].deleteDB();
  delete buckets[id];
  storageManager.setItem("dbs", JSON.stringify(Object.keys(buckets)));
  return Promise.resolve();
};

const getBucket: IFS["getBucket"] = function (id: string) {
  return Promise.resolve(buckets[id]);
};

const saveAs: IFS["saveAs"] = async function (
  path: string,
  link: string,
  { dialog }
) {
  if (link === "") {
    return Promise.resolve();
  }
  window.URL = window.URL || window.webkitURL;
  const filename = filenamify(path ?? "stream.mp4").normalize("NFC");

  await downloads.download({
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
