import {
  openDB,
  deleteDB,
  DBSchema,
  IDBPDatabase,
  IDBPCursorWithValue,
} from "idb";

import { Bucket, IFS } from "@hls-downloader/core/lib/services";
import { browser } from "webextension-polyfill-ts";
import sanitize from "sanitize-filename";

const buckets: Record<string, IndexedDBBucket> = {};

interface ChunksDB extends DBSchema {
  chunks: {
    value: {
      data: ArrayBuffer;
      index: number;
    };
    key: string;
    indexes: { index: number };
  };
}

export class IndexedDBBucket implements Bucket {
  readonly objectStoreName = "chunks";
  private db?: IDBPDatabase<ChunksDB>;

  constructor(readonly length: number, readonly id: string) {}

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
    this.db = db;
  }

  async write(index: number, data: ArrayBuffer): Promise<void> {
    if (!this.db) {
      await this.openDB();
    }
    await this.db!.add(this.objectStoreName, { data, index });
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
          function push(
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
              controller.enqueue(new Uint8Array(currentCursor.value.data));
              return currentCursor.continue().then((nextCursor) => {
                push(nextCursor);
              });
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
    const stream = await this.stream();
    const response = new Response(stream, {
      headers: {
        "Content-Type": "video/mp2t",
      },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  }
}

const cleanup: IFS["cleanup"] = async function () {
  const dbsString = localStorage.getItem("dbs");
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
  length: number
) {
  buckets[id] = new IndexedDBBucket(length, id);

  localStorage.setItem("dbs", JSON.stringify(Object.keys(buckets)));
  return Promise.resolve();
};

const deleteBucket: IFS["deleteBucket"] = async function (id: string) {
  await buckets[id].deleteDB();
  delete buckets[id];
  localStorage.setItem("dbs", JSON.stringify(Object.keys(buckets)));
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
  window.URL = window.URL || window.webkitURL;
  const filename = sanitize(path ?? "steam.mp4");

  await browser.downloads.download({
    url: link,
    saveAs: dialog,
    conflictAction: "uniquify",
    filename,
  });
  URL.revokeObjectURL(link);
  return Promise.resolve();
};

export const IndexedDBFS: IFS = {
  getBucket,
  createBucket,
  deleteBucket,
  saveAs,
  cleanup,
};
