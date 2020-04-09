import { IFS } from "core/dist/services/FS";
import { promises } from "fs";

type FragmentStore = {
  length: number;
  store: Record<number, Buffer>;
};

const buckets: Record<string, FragmentStore> = {};

export const LocalFS: IFS = {
  write: (path, data) =>
    promises.writeFile("./temp/" + path, Buffer.from(data)),
  getBucket: (id: string) => {
    const b = buckets[id];
    return {
      write: writeFactory(b),
      merge: mergeFactory(b),
    };
  },
  createBucket: (id: string, length: number) => {
    if (buckets[id]) {
      return buckets[id];
    }
    buckets[id] = {
      length,
      store: {},
    };
  },
};

function writeFactory(chunkStore: FragmentStore) {
  return (index: number, data: ArrayBuffer): Promise<void> => {
    chunkStore.store[index] = Buffer.from(data);
    return Promise.resolve();
  };
}

function mergeFactory(chunkStore: FragmentStore) {
  return async (): Promise<ArrayBuffer> => {
    let data = new Uint8Array();
    for (let index = 0; index < chunkStore.length; index++) {
      const chunk = chunkStore.store[index];
      const merged = new Uint8Array(data.length + chunk.length);
      merged.set(data);
      merged.set(chunk, data.length);
      data = merged;
    }
    return Promise.resolve(data.buffer);
  };
}
