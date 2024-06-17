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
    key: string;
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
    readonly length: number,
    readonly id: string,
  ) {}

  async cleanup() {
    await this.deleteDB();
    this.ffmpeg.deleteFile(`${this.fileName}.mp4`);
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
          keyPath: "index",
        });
        store.createIndex("index", "index", { unique: true });
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

    let cursor = await store.openCursor();
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
            > | null,
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
      {},
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
    const stream = await this.stream();
    const response = new Response(stream, {
      headers: {
        "Content-Type": "video/mp2t",
      },
    });
    const blob = await response.blob();
    const file = await fetchFile(blob);
    await this.ffmpeg.writeFile(`${this.fileName}.ts`, file);
    await this.ffmpeg.exec([
      "-i",
      `${this.fileName}.ts`,
      "-acodec",
      "copy",
      "-vcodec",
      "copy",
      `${this.fileName}.mp4`,
    ]);
    await this.ffmpeg.deleteFile(`${this.fileName}.ts`);
    const data = await this.ffmpeg.readFile(`${this.fileName}.mp4`);
    return new Blob([data], { type: "video/mp4" });
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
  length: number,
) {
  buckets[id] = new IndexedDBBucket(length, id);

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
  { dialog },
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
