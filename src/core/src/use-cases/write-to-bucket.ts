import { IFS } from "../services";

export const writeToBucketFactory = (fs: IFS) => {
  const run = async (
    bucketID: string,
    index: number,
    data: ArrayBuffer,
    signal?: AbortSignal,
  ): Promise<void> => {
    signal?.throwIfAborted();
    const bucket = await fs.getBucket(bucketID);
    signal?.throwIfAborted();
    if (!bucket) {
      throw new Error(`Download data for ${bucketID} was not found`);
    }
    await bucket.write(index, data);
  };
  return run;
};
