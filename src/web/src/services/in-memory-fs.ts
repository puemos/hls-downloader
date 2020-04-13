import { Bucket, IFS } from "@hls-downloader/core/lib/services";
import * as Comlink from "comlink";
/* eslint-disable import/no-webpack-loader-syntax */
// @ts-ignore
import MergeWorker from "worker-loader!./merge-worker";
import { IMergeWorker } from "./merge-worker";

const buckets: Record<string, Bucket> = {};

export class InMemoryBucket implements Bucket {
  private store: Record<string, Uint8Array> = {};
  constructor(readonly length: number) {}
  write(index: number, data: Uint8Array): Promise<void> {
    this.store[index] = new Uint8Array(data);
    return Promise.resolve();
  }
  async merge(): Promise<Uint8Array> {
    const mergeWorker = new MergeWorker();
    const obj = Comlink.wrap<IMergeWorker>(mergeWorker);
    // @ts-ignore
    const res: Uint8Array = await obj.merge(this.store, this.length);
    return res;
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
  window.URL = window.URL || window.webkitURL;
  const blob = new Blob([data], {
    type: "video/MP2T",
  });
  const linkURL = URL.createObjectURL(blob);
  const linkElem = document.createElement("a");
  linkElem.href = linkURL;
  linkElem.download = "";
  document.body.appendChild(linkElem);
  linkElem.click();
  document.body.removeChild(linkElem);
  URL.revokeObjectURL(linkURL);
  return Promise.resolve();
};

export const InMemoryFS: IFS = {
  getBucket,
  createBucket,
  write,
};
