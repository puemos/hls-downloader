import { IFS } from "../services/FS";

export const appendToFileFactory = (fs: IFS) => {
  const run = async (path: string, data: ArrayBuffer): Promise<void> => {
    await fs.append(path, data);
  };
  return run;
};
