import { Fragment } from "../entities/fragment";
import { Loader } from "../services/Loader";

export const downloadSingleFragmentFactory = (loader: Loader) => {
  const run = async (fragment: Fragment): Promise<ArrayBuffer> => {
    const fragmentArrayBuffer = await loader.fetchArrayBuffer(fragment.uri);
    return fragmentArrayBuffer;
  };
  return run;
};
