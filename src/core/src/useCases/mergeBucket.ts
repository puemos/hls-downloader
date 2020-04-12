import { IFS } from "../services/FS";

export const mergeBucketFactory = (fs: IFS) => {
  const run = async (bucketID: string): Promise<ArrayBuffer> => {
    const bucket = fs.getBucket(bucketID);
    return await bucket.merge();
  };
  return run;
};
