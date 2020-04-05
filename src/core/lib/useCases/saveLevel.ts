import PQueue from "p-queue";
import { Config } from "../entities/config";
import { Level } from "../entities/level";
import { Decryptor } from "../services/Decryptor";
import { FS } from "../services/FS";
import { Loader } from "../services/Loader";
import { Parser } from "../services/Parser";
import { getFragmentsDetailsFactory } from "./getFragmentsDetails";
import { saveFragmentFactory } from "./saveFragment";

export const saveLevelFactory = (
  config: Config,
  loader: Loader,
  decryptor: Decryptor,
  parser: Parser,
  fs: FS
) => {
  const getFragmentsDetails = getFragmentsDetailsFactory(loader, parser);
  const saveFragment = saveFragmentFactory(loader, decryptor);
  const run = async (
    level: Level,
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
    const fragments = await getFragmentsDetails(level);
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
