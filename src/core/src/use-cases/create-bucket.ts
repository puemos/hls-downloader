import { IFS } from "../services";

export const createBucketFactory = (fs: IFS) => {
  const run = async (
    bucketID: string,
    videoLength: number,
    audioLength: number,
  ): Promise<void> => {
    await fs.createBucket(bucketID, videoLength, audioLength);
  };
  return run;
};
