import { IFS } from "../services";

export const writeToFileFactory = (fs: IFS) => {
  const run = async (
    path: string,
    data: ArrayBuffer,
    options: { dialog: boolean }
  ): Promise<void> => {
    await fs.write(path, data, options);
  };
  return run;
};
