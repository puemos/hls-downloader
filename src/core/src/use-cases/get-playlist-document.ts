import { Level } from "../entities";
import { ILoader, LoadedText } from "../services";
import { fetchWithFallback } from "../utils/fetch";
import { appendQueryParams } from "../utils/url";

export interface PlaylistDocument extends LoadedText {
  baseUri: string;
}

export async function loadPlaylistText(
  loader: ILoader,
  uri: string,
  attempts: number,
): Promise<LoadedText> {
  return loader.fetchTextResponse
    ? loader.fetchTextResponse(uri, attempts)
    : { text: await loader.fetchText(uri, attempts), uri };
}

export const getPlaylistDocumentFactory = (loader: ILoader) => {
  return async (
    level: Level,
    attempts: number,
    options: { baseUri?: string } = {},
  ): Promise<PlaylistDocument> => {
    const baseUri =
      level.baseUri ?? options.baseUri ?? level.playlistID ?? level.uri;
    const primary = appendQueryParams(baseUri, level.uri);
    const { uri: requestedURI, data } = await fetchWithFallback(
      primary,
      primary !== level.uri ? level.uri : null,
      attempts,
      (uri, count) => loadPlaylistText(loader, uri, count),
    );
    // A redirected CDN URL can replace expired authentication parameters. Use
    // that response's context for its segments, initialization maps, and keys.
    return { ...data, baseUri: data.uri !== requestedURI ? data.uri : baseUri };
  };
};
