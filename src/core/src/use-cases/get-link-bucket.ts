import { IFS } from "../services";

export const getLinkBucketFactory = (fs: IFS) => {
  const run = async (
    bucketID: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<string> => {
    const bucket = await fs.getBucket(bucketID);
    return await bucket.getLink(onProgress);
  };
  return run;
};
