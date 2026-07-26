import type {
  IFS,
  PreparedDownload,
  PrepareDownloadOptions,
} from "../services";

export const prepareDownloadBucketFactory = (fs: IFS) => {
  const run = async (
    bucketID: string,
    onProgress?: (progress: number, message: string) => void,
    options?: PrepareDownloadOptions,
  ): Promise<PreparedDownload> => {
    const bucket = await fs.getBucket(bucketID);
    if (!bucket) {
      throw new Error(`Download data for ${bucketID} was not found`);
    }
    return await bucket.prepareDownload(onProgress, options);
  };
  return run;
};
