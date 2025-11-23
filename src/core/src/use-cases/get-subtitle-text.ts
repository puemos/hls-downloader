import { Level } from "../entities";
import { ILoader, IParser } from "../services";
import { getFragmentsDetailsFactory } from "./get-fragments-details";
import { appendQueryParams } from "../utils/url";
import { fetchWithFallback } from "../utils/fetch";

export const getSubtitleTextFactory = (loader: ILoader, parser: IParser) => {
  const run = async (
    level: Level,
    fetchAttempts: number,
    options: { baseUri?: string } = {}
  ): Promise<string> => {
    const baseUri = options.baseUri ?? level.playlistID ?? level.uri;
    const fragments = await getFragmentsDetailsFactory(loader, parser)(
      level,
      fetchAttempts,
      {
        baseUri,
      }
    );

    const parts: string[] = [];

    if (fragments.length > 0) {
      for (const fragment of fragments) {
        const { data: fragmentText } = await fetchWithFallback(
          fragment.uri,
          fragment.fallbackUri,
          fetchAttempts,
          loader.fetchText
        );
        parts.push(fragmentText.trim());
      }
    } else {
      const primaryUri = appendQueryParams(baseUri, level.uri);
      const fallbackUri =
        primaryUri !== level.uri ? level.uri : options.baseUri ?? null;
      const { data: text } = await fetchWithFallback(
        primaryUri,
        fallbackUri,
        fetchAttempts,
        loader.fetchText
      );
      parts.push(text.trim());
    }

    return parts.join("\n\n");
  };

  return run;
};
