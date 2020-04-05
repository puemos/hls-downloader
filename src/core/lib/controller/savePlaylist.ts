import PQueue from "p-queue";
import { Config } from "../entities/config";
import { Playlist } from "../entities/playlist";
import { IDecryptor } from "../services/Decryptor";
import { IFS } from "../services/FS";
import { ILoader } from "../services/Loader";
import { IParser } from "../services/Parser";
import { getFragmentsDetailsFactory } from "../useCases/getFragmentsDetails";
import { saveFragmentFactory } from "./saveFragment";

export const savePlaylistFactory = (
  config: Config,
  loader: ILoader,
  decryptor: IDecryptor,
  parser: IParser,
  fs: IFS
) => {
  const getFragmentsDetails = getFragmentsDetailsFactory(loader, parser);
  const saveFragment = saveFragmentFactory(loader, decryptor);
  const run = async (
    playlist: Playlist,
    taskID: string,
    onStart: (total: number) => any,
    onProgress: () => any,
    onDone: () => any
  ) => {
    const queue = new PQueue({
      concurrency: config.concurrency,
      autoStart: false,
    });
    const bucket = fs.bucket(taskID);
    const fragments = await getFragmentsDetails(playlist);
    fragments.forEach((fragment) => {
      queue.add(() => saveFragment(fragment, bucket));
    });
    queue.start();
    onStart(fragments.length);
    queue.on("active", () => {
      onProgress();
    });
    await queue.onIdle();
    onDone();
  };
  return run;
};
