import { IFS } from "../services";

export const getLinkBucketFactory = (fs: IFS) => {
  const run = async (bucketID: string): Promise<string> => {
    const bucket = await fs.getBucket(bucketID);
    return await bucket.getLink();
  };
  return run;
};
