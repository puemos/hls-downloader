import { Fragment } from "../entities";
import { ILoader } from "../services";

export const downloadSingleFactory = (loader: ILoader) => {
  const run = async (
    fragment: Fragment,
    fetchAttempts: number
  ): Promise<ArrayBuffer> => {
    const data = await loader.fetchArrayBuffer(fragment.uri, fetchAttempts);
    return data;
  };
  return run;
};
