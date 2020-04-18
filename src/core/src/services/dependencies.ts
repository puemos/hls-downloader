import { IDecryptor, IFS, ILoader, IParser } from ".";

export type Dependencies = {
  loader: ILoader;
  decryptor: IDecryptor;
  parser: IParser;
  fs: IFS;
};
