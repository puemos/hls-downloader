import { Config } from "../../entities/config";
import { ILoader } from "../../services/Loader";
import { IDecryptor } from "../../services/Decryptor";
import { IParser } from "../../services/Parser";
import { IFS } from "../../services/FS";

export type EpicDependencies = {
  config: Config;
  loader: ILoader;
  decryptor: IDecryptor;
  parser: IParser;
  fs: IFS;
};
