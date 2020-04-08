import { IFS } from "../services/FS";

export const readFromFileFactory = (fs: IFS) => {
  const run = async (path: string): Promise<ArrayBuffer> => {
    return await fs.read(path);
  };
  return run;
};
