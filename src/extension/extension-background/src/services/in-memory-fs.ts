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
  async getLink(): Promise<string> {
    const blob = new Blob(Object.values(this.store), {
      type: "video/mp2t",
    });
    const url = URL.createObjectURL(blob);

    return url;
  }
}

const createBucket: IFS["createBucket"] = function (
  id: string,
  length: number
) {
  buckets[id] = new InMemoryBucket(length);
  return Promise.resolve();
};

const deleteBucket: IFS["deleteBucket"] = function (id: string) {
  delete buckets[id];
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

export const InMemoryFS: IFS = {
  getBucket,
  createBucket,
  deleteBucket,
  saveAs,
  cleanup: () => Promise.resolve(),
};
