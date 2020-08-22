import { Fragment } from "../entities";
import { ILoader } from "../services";

export const downloadSingleFactory = (loader: ILoader) => {
  const run = async (
    fragment: Fragment
  ): Promise<ArrayBuffer> => {
    const data = await loader.fetchArrayBuffer(fragment.uri);
    return data;
  };
  return run;
};
