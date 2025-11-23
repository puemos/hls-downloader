import { Fragment } from "../entities";
import { ILoader } from "../services";
import { fetchWithFallback } from "../utils/fetch";

export const downloadSingleFactory = (loader: ILoader) => {
  const run = async (
    fragment: Fragment,
    fetchAttempts: number
  ): Promise<ArrayBuffer> => {
    const { data } = await fetchWithFallback(
      fragment.uri,
      fragment.fallbackUri,
      fetchAttempts,
      loader.fetchArrayBuffer
    );
    return data;
  };
  return run;
};
