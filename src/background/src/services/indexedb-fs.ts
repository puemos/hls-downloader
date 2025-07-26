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

export class IndexedDBBucket implements Bucket {
  readonly fileName = "file";
  readonly objectStoreName = "chunks";
  private db?: IDBPDatabase<ChunksDB>;
  ffmpeg: FFmpeg;

  constructor(
    readonly videoLength: number,
    readonly audioLength: number,
    readonly id: string
  ) {}

  async cleanup() {
    await this.deleteDB();
    try {
      await this.ffmpeg.deleteFile(`${this.fileName}.mp4`);
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
        store.createIndex("index", "index");
      },
    });

    const baseURL = "/assets/ffmpeg";

    this.ffmpeg = new FFmpeg();

    await this.ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
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
    const videoChunks: Uint8Array[] = [];
    const audioChunks: Uint8Array[] = [];
    const store = this.db
      .transaction(this.objectStoreName)
      .objectStore(this.objectStoreName);
    let cursor = await store.openCursor();
    while (cursor) {
      const chunk: Uint8Array = cursor.value.data;
      if (cursor.key < this.videoLength) {
        videoChunks.push(chunk);
      } else {
        audioChunks.push(chunk);
      }
      cursor = await cursor.continue();
    }
    if (this.videoLength > 0) {
      const videoBlob = new Blob(videoChunks, { type: "video/mp2t" });
      const videoFile = await fetchFile(videoBlob);
      await this.ffmpeg.writeFile("video.ts", videoFile);
    }
    if (this.audioLength > 0) {
      const audioBlob = new Blob(audioChunks, { type: "video/mp2t" });
      const audioFile = await fetchFile(audioBlob);
      await this.ffmpeg.writeFile("audio.ts", audioFile);
    }

    const outputFileName = `${this.fileName}.mp4`;

    if (this.videoLength > 0 && this.audioLength > 0) {
      await this.ffmpeg.exec([
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
        "-movflags",
        "faststart",
        outputFileName,
      ]);
      try {
        await this.ffmpeg.deleteFile("video.ts");
        await this.ffmpeg.deleteFile("audio.ts");
      } catch (error) {
        // Files may not exist, ignore error
      }
    } else if (this.videoLength > 0) {
      await this.ffmpeg.exec([
        "-i",
        "video.ts",
        "-c:v",
        "copy",
        "-movflags",
        "faststart",
        outputFileName,
      ]);
      try {
        await this.ffmpeg.deleteFile("video.ts");
      } catch (error) {
        // File may not exist, ignore error
      }
    } else {
      await this.ffmpeg.exec([
        "-i",
        "audio.ts",
        "-c:a",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "-movflags",
        "faststart",
        outputFileName,
      ]);
      try {
        await this.ffmpeg.deleteFile("audio.ts");
      } catch (error) {
        // File may not exist, ignore error
      }
    }

    // Check if the output file exists before trying to read it
    try {
      const data = await this.ffmpeg.readFile(outputFileName);
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
