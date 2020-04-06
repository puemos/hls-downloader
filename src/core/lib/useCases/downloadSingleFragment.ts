import { Fragment } from "../entities/fragment";
import { ILoader } from "../services/Loader";

export const downloadSingleFragmentFactory = (loader: ILoader) => {
  const run = async (
    fragment: Fragment
  ): Promise<ArrayBuffer> => {
    const data = await loader.fetchArrayBuffer(fragment.uri);
    return data;
  };
  return run;
};
