import { Bucket, IFS } from "@hls-downloader/core/lib/services";
import { browser } from "webextension-polyfill-ts";
import sanitize from "sanitize-filename";
const buckets: Record<string, Bucket> = {};

export class InMemoryBucket implements Bucket {
  private store: Record<string, Blob> = {};
  constructor(readonly length: number) {}
  write(index: number, data: Uint8Array): Promise<void> {
    this.store[index] = new Blob([new Uint8Array(data)]);
    return Promise.resolve();
  }
  async merge(): Promise<Uint8Array> {
    const all = new Blob(Object.values(this.store), {
      type: "video/mp2t",
    });
    const ab = await all.arrayBuffer();
    return new Uint8Array(ab);
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

const write: IFS["write"] = async function (
  path: string,
  data: Uint8Array,
  { dialog }
) {
  window.URL = window.URL || window.webkitURL;
  const blob = new Blob([data], {
    type: "video/MP2T",
  });
  const url = URL.createObjectURL(blob);
  const filename = sanitize(path ?? "steam.mp4");
  console.log({ filename });

  await browser.downloads.download({
    url,
    saveAs: dialog,
    conflictAction: "uniquify",
    filename,
  });
  URL.revokeObjectURL(url);
  return Promise.resolve();
};

export const InMemoryFS: IFS = {
  getBucket,
  createBucket,
  write,
};
