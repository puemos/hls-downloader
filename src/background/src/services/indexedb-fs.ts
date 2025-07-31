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
import { runtime } from "webextension-polyfill";
import { ensureOffscreen } from "../helpers/offscreen";

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
  // make output name unique per bucket
  readonly fileName: string;
  readonly objectStoreName = "chunks";
  private db?: IDBPDatabase<ChunksDB>;

  constructor(
    readonly videoLength: number,
    readonly audioLength: number,
    readonly id: string
  ) {
    this.fileName = filenamify(id) ?? "file";
  }

  async cleanup() {
    await this.deleteDB();
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

    const data = await this.streamToTsArray();
    await ensureOffscreen();
    const { url } = await runtime.sendMessage({
      type: "ts-to-object-url",
      data,
    });
    return url as string;
  }

  private async streamToTsArray(): Promise<number[]> {
    if (!this.db) {
      throw Error();
    }
    const chunks: Uint8Array[] = [];
    const total = this.videoLength + this.audioLength;
    for (let i = 0; i < total; i++) {
      const chunk = await this.readChunkByIndex(i);
      if (chunk) {
        chunks.push(chunk);
      }
    }
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    return Array.from(buffer);
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
  await runtime.sendMessage({ type: "revoke-object-url", url: link });
  return Promise.resolve();
};

export const IndexedDBFS: IFS = {
  getBucket,
  createBucket,
  deleteBucket,
  saveAs,
  cleanup,
};
