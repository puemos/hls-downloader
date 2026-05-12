import { Fragment } from "../entities";
import { ILoader } from "../services";
import { fetchWithFallback } from "../utils/fetch";

export const downloadSingleFactory = (loader: ILoader) => {
  const run = async (
    fragment: Fragment,
    fetchAttempts: number
  ): Promise<ArrayBuffer> => {
    const fetcher = (uri: string, attempts: number) =>
      fragment.byteRange
        ? loader.fetchArrayBuffer(uri, attempts, fragment.byteRange)
        : loader.fetchArrayBuffer(uri, attempts);
    const { data } = await fetchWithFallback(
      fragment.uri,
      fragment.fallbackUri,
      fetchAttempts,
      fetcher
    );
    return data;
  };
  return run;
};
