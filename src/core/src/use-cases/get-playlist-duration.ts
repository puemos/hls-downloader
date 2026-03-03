import { ILoader } from "../services";
import { fetchWithFallback } from "../utils/fetch";

/**
 * Fetch a level playlist and sum EXTINF durations (seconds).
 */
export const getPlaylistDurationFactory = (loader: ILoader) => {
  const run = async (
    uri: string,
    fallbackUri: string | null,
    fetchAttempts: number
  ): Promise<number | null> => {
    const { data } = await fetchWithFallback(
      uri,
      fallbackUri,
      fetchAttempts,
      loader.fetchText
    );
    const duration = data
      .split("\n")
      .filter((line) => line.startsWith("#EXTINF:"))
      .map((line) => {
        const value = line.slice("#EXTINF:".length).split(",")[0];
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
      })
      .reduce((sum, val) => sum + val, 0);
    return duration > 0 ? duration : null;
  };
  return run;
};
