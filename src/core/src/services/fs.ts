import type { OutputContainer } from "../entities";

export type PrepareDownloadOptions = {
  container?: OutputContainer;
};

export type PreparedDownload = {
  url: string;
  exportId: string;
  mime: string;
  size: number;
};

export interface IFS {
  cleanup(): Promise<void>;
  getBucket(id: string): Promise<Bucket | undefined>;
  createBucket(
    id: string,
    videoLength: number,
    audioLength: number,
  ): Promise<void>;
  deleteBucket(id: string): Promise<void>;
  setSubtitleText(
    id: string,
    subtitle: { text: string; language?: string; name?: string },
  ): Promise<void>;
  getSubtitleText(
    id: string,
  ): Promise<{ text: string; language?: string; name?: string } | undefined>;
  prepareTextDownload(text: string, mime: string): Promise<PreparedDownload>;
  saveAs(
    path: string,
    download: PreparedDownload,
    options: {
      dialog: boolean;
    },
  ): Promise<number>;
  getStorageStats(): Promise<StorageSnapshot>;
}

export interface Bucket {
  write(index: number, data: ArrayBuffer): Promise<void>;
  prepareDownload(
    onProgress?: (progress: number, message: string) => void,
    options?: PrepareDownloadOptions,
  ): Promise<PreparedDownload>;
}

export type StorageBucketInfo = {
  id: string;
  videoLength: number;
  audioLength: number;
  storedBytes: number;
  storedChunks: number;
  updatedAt?: number;
};

export type StorageEstimate = {
  usage?: number;
  quota?: number;
  available?: number;
  persisted?: boolean;
  quotaExempt?: boolean;
  quotaIsAdvisory?: boolean;
  source: "navigator" | "fallback" | "unknown";
};

export type StorageSnapshot = {
  buckets: StorageBucketInfo[];
  subtitlesBytes?: number;
  estimate?: StorageEstimate;
};
