import { IFS } from "../services";

export const fsCleanupFactory = (fs: IFS) => {
  const run = async (): Promise<void> => {
    await fs.cleanup();
  };
  return run;
};
