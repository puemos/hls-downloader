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
  readonly fileName = "file";
  readonly objectStoreName = "chunks";
  private db?: IDBPDatabase<ChunksDB>;

  constructor(
    readonly videoLength: number,
    readonly audioLength: number,
    readonly id: string
  ) {}

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

  async getLink(): Promise<string> {
    if (!this.db) {
      throw Error();
    }

    try {
      const mp4Blob = await this.streamToMp4Blob();
      const url = URL.createObjectURL(mp4Blob);
      return url;
    } catch (error) {
      console.error(error);
      return "";
    }
  }

  private async streamToMp4Blob() {
    if (!this.db) {
      throw Error();
    }

    const ffmpeg = await FFmpegSingleton.getInstance();

    // Helper function to read chunks by index to avoid transaction timeout
    const readChunkByIndex = async (
      chunkIndex: number
    ): Promise<Uint8Array | null> => {
      const transaction = this.db!.transaction(
        this.objectStoreName,
        "readonly"
      );
      const store = transaction.objectStore(this.objectStoreName);
      const index = store.index("index");

      try {
        const result = await index.get(chunkIndex);
        return result ? result.data : null;
      } catch (error) {
        console.error(`Error reading chunk ${chunkIndex}:`, error);
        return null;
      }
    };

    // Write video chunks directly to FFmpeg
    if (this.videoLength > 0) {
      for (let i = 0; i < this.videoLength; i++) {
        const chunk = await readChunkByIndex(i);
        if (chunk) {
          await ffmpeg.writeFile(`video_chunk_${i}.ts`, chunk);
        }
      }
    }

    // Write audio chunks directly to FFmpeg
    if (this.audioLength > 0) {
      for (let i = 0; i < this.audioLength; i++) {
        const chunkIndex = this.videoLength + i;
        const chunk = await readChunkByIndex(chunkIndex);
        if (chunk) {
          await ffmpeg.writeFile(`audio_chunk_${i}.ts`, chunk);
        }
      }
    }

    const outputFileName = `${this.fileName}.mp4`;

    // Create input file lists for FFmpeg concat
    if (this.videoLength > 0 && this.audioLength > 0) {
      // Create concat files
      let videoList = "";
      for (let i = 0; i < this.videoLength; i++) {
        videoList += `file 'video_chunk_${i}.ts'\n`;
      }
      await ffmpeg.writeFile("video_list.txt", videoList);

      let audioList = "";
      for (let i = 0; i < this.audioLength; i++) {
        audioList += `file 'audio_chunk_${i}.ts'\n`;
      }
      await ffmpeg.writeFile("audio_list.txt", audioList);

      // Concatenate chunks first, then combine
      await ffmpeg.exec([
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "video_list.txt",
        "-c",
        "copy",
        "video.ts",
      ]);

      await ffmpeg.exec([
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "audio_list.txt",
        "-c",
        "copy",
        "audio.ts",
      ]);

      // Now combine video and audio
      await ffmpeg.exec([
        "-y",
        "-fflags",
        "+genpts",
        "-i",
        "video.ts",
        "-i",
        "audio.ts",
        // Explicitly map one video + one audio stream
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        // Keep video, re-encode audio for MP4 compatibility & drift fix
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        // Smooth tiny drift & reset first pts
        "-af",
        "aresample=async=1:first_pts=0",
        // Stop when the shortest input ends
        "-shortest",
        // Make MP4 start quicker in browsers
        "-movflags",
        "+faststart",
        outputFileName,
      ]);

      // Cleanup intermediate files
      try {
        await ffmpeg.deleteFile("video.ts");
        await ffmpeg.deleteFile("audio.ts");
        await ffmpeg.deleteFile("video_list.txt");
        await ffmpeg.deleteFile("audio_list.txt");
        for (let i = 0; i < this.videoLength; i++) {
          await ffmpeg.deleteFile(`video_chunk_${i}.ts`);
        }
        for (let i = 0; i < this.audioLength; i++) {
          await ffmpeg.deleteFile(`audio_chunk_${i}.ts`);
        }
      } catch (error) {
        // Files may not exist, ignore error
      }
    } else if (this.videoLength > 0) {
      // Create concat file for video only
      let videoList = "";
      for (let i = 0; i < this.videoLength; i++) {
        videoList += `file 'video_chunk_${i}.ts'\n`;
      }
      await ffmpeg.writeFile("video_list.txt", videoList);

      await ffmpeg.exec([
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "video_list.txt",
        "-c:v",
        "copy",
        "-movflags",
        "+faststart",
        outputFileName,
      ]);

      // Cleanup
      try {
        await ffmpeg.deleteFile("video_list.txt");
        for (let i = 0; i < this.videoLength; i++) {
          await ffmpeg.deleteFile(`video_chunk_${i}.ts`);
        }
      } catch (error) {
        // Files may not exist, ignore error
      }
    } else {
      // Create concat file for audio only
      let audioList = "";
      for (let i = 0; i < this.audioLength; i++) {
        audioList += `file 'audio_chunk_${i}.ts'\n`;
      }
      await ffmpeg.writeFile("audio_list.txt", audioList);

      await ffmpeg.exec([
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "audio_list.txt",
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

      // Cleanup
      try {
        await ffmpeg.deleteFile("audio_list.txt");
        for (let i = 0; i < this.audioLength; i++) {
          await ffmpeg.deleteFile(`audio_chunk_${i}.ts`);
        }
      } catch (error) {
        // Files may not exist, ignore error
      }
    }

    // Check if the output file exists before trying to read it
    try {
      const data = await ffmpeg.readFile(outputFileName);
      return new Blob([data], { type: "video/mp4" });
    } catch (error) {
      console.error(`Failed to read output file ${outputFileName}:`, error);
      throw new Error(
        `Output file ${outputFileName} was not created by FFmpeg`
      );
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
  const filename = filenamify(path ?? "stream.mp4");

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
