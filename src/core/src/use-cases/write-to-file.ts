import type { IFS, PreparedDownload } from "../services";

export const saveAsFactory = (fs: IFS) => {
  const run = async (
    path: string,
    download: PreparedDownload,
    options: { dialog: boolean },
  ): Promise<number> => {
    return await fs.saveAs(path, download, options);
  };
  return run;
};
