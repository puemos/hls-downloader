import { IFS } from "../services";

export const deleteBucketFactory = (fs: IFS) => {
  const run = async (bucketID: string): Promise<void> => {
    await fs.deleteBucket(bucketID);
  };
  return run;
};
