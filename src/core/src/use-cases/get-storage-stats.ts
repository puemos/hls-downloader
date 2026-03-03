import { IFS, StorageEstimate, StorageSnapshot } from "../services";

export const STORAGE_WARNING_RATIO = 0.9;
export const STORAGE_WARNING_MIN_AVAILABLE_BYTES = 200 * 1024 * 1024;

export type StorageBucketStats = {
  id: string;
  storedBytes: number;
  storedChunks: number;
  totalFragments: number;
  averageChunkBytes?: number;
  expectedBytes?: number;
  videoLength: number;
  audioLength: number;
  updatedAt?: number;
};

export type StorageStats = {
  buckets: StorageBucketStats[];
  totalUsedBytes: number;
  availableBytes?: number;
  quotaBytes?: number;
  estimateSource: StorageEstimate["source"];
  nearQuota: boolean;
  subtitlesBytes?: number;
};

export const getStorageStatsFactory = (
  fs: IFS,
  options?: {
    warningRatio?: number;
    minAvailableBytes?: number;
  }
) => {
  const run = async (): Promise<StorageStats> => {
    const snapshot: StorageSnapshot = await fs.getStorageStats();

    const buckets: StorageBucketStats[] = snapshot.buckets.map((bucket) => {
      const totalFragments = Math.max(
        0,
        (bucket.videoLength ?? 0) + (bucket.audioLength ?? 0)
      );
      const averageChunkBytes =
        bucket.storedChunks > 0
          ? bucket.storedBytes / bucket.storedChunks
          : undefined;
      const expectedBytes =
        averageChunkBytes !== undefined && totalFragments > 0
          ? averageChunkBytes * totalFragments
          : undefined;

      return {
        id: bucket.id,
        storedBytes: bucket.storedBytes,
        storedChunks: bucket.storedChunks,
        totalFragments,
        averageChunkBytes,
        expectedBytes,
        videoLength: bucket.videoLength,
        audioLength: bucket.audioLength,
        updatedAt: bucket.updatedAt,
      };
    });

    const fragmentBytes = buckets.reduce(
      (sum, bucket) => sum + bucket.storedBytes,
      0
    );
    const subtitlesBytes = snapshot.subtitlesBytes ?? 0;

    const totalUsedBytes = fragmentBytes + subtitlesBytes;

    const usageForAvailable = snapshot.estimate?.usage ?? totalUsedBytes;
    const quotaBytes = snapshot.estimate?.quota;
    const availableBytes =
      snapshot.estimate?.available ??
      (quotaBytes !== undefined && usageForAvailable !== undefined
        ? Math.max(0, quotaBytes - usageForAvailable)
        : undefined);

    const warningRatio = options?.warningRatio ?? STORAGE_WARNING_RATIO;
    const minAvailableBytes =
      options?.minAvailableBytes ?? STORAGE_WARNING_MIN_AVAILABLE_BYTES;

    const nearQuota =
      (quotaBytes !== undefined &&
        usageForAvailable !== undefined &&
        quotaBytes > 0 &&
        usageForAvailable / quotaBytes >= warningRatio) ||
      (availableBytes !== undefined && availableBytes <= minAvailableBytes);

    return {
      buckets,
      totalUsedBytes,
      quotaBytes,
      availableBytes,
      estimateSource: snapshot.estimate?.source ?? "unknown",
      nearQuota,
      subtitlesBytes,
    };
  };

  return run;
};
