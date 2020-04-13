import { IFS } from "../services";

export const writeToBucketFactory = (fs: IFS) => {
  const run = async (
    bucketID: string,
    index: number,
    data: ArrayBuffer
  ): Promise<void> => {
    const bucket = fs.getBucket(bucketID);
    await bucket.write(index, data);
  };
  return run;
};
