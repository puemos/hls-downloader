import { Config } from "../entities/config";
import { ILoader } from "./Loader";
import { IDecryptor } from "./Decryptor";
import { IParser } from "./Parser";
import { IFS } from "./FS";

export type Dependencies = {
  config: Config;
  loader: ILoader;
  decryptor: IDecryptor;
  parser: IParser;
  fs: IFS;
};
