import { IDecryptor, IFS, ILoader, IParser } from ".";
import { Config } from "../entities";

export type Dependencies = {
  config: Config;
  loader: ILoader;
  decryptor: IDecryptor;
  parser: IParser;
  fs: IFS;
};
