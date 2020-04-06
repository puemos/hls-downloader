import { IFS } from "../services/FS";

export const writeToFSFactory = (fs: IFS) => {
  const run = async (path: string, data: ArrayBuffer): Promise<void> => {
    await fs.write(path, data);
  };
  return run;
};
