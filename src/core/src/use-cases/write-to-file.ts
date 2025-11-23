import { IFS } from "../services";

export const saveAsFactory = (fs: IFS) => {
  const run = async (
    path: string,
    link: string,
    options: { dialog: boolean }
  ): Promise<void> => {
    await fs.saveAs(path, link, options);
  };
  return run;
};
