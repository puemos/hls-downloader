import { IFS, Bucket } from "@hls-downloader/core/lib/services/FS";

const buckets: Record<string, Bucket> = {};

export class InMemoryBucket implements Bucket {
  private store: Record<string, Uint8Array> = {};
  constructor(readonly length: number) {}
  write(index: number, data: Uint8Array): Promise<void> {
    this.store[index] = new Uint8Array(data);
    return Promise.resolve();
  }
  merge(): Promise<Uint8Array> {
    const totalLength = Object.values(this.store).reduce(
      (prev, curr) => prev + curr.length,
      0
    );
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let index = 0; index < this.length; index++) {
      const arr = this.store[index];
      result.set(arr, offset);
      offset += arr.byteLength;
    }

    return Promise.resolve(result);
  }
}

const createBucket: IFS["createBucket"] = function (
  id: string,
  length: number
) {
  buckets[id] = new InMemoryBucket(length);
  return buckets[id];
};

const getBucket: IFS["getBucket"] = function (id: string) {
  return buckets[id];
};

const write: IFS["write"] = function (path: string, data: Uint8Array) {
  new Blob([data]);
  return Promise.resolve();
};

export const InMemoryFS: IFS = {
  getBucket,
  createBucket,
  write,
};
