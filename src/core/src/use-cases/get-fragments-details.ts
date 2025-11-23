import { Fragment, Key, Level } from "../entities";
import { ILoader, IParser } from "../services";
import { fetchWithFallback } from "../utils/fetch";
import { appendQueryParams } from "../utils/url";

export interface GetFragmentsDetailsOptions {
  baseUri?: string;
}

export const getFragmentsDetailsFactory = (
  loader: ILoader,
  parser: IParser
) => {
  const run = async (
    playlist: Level,
    fetchAttempts: number,
    options: GetFragmentsDetailsOptions = {}
  ): Promise<Fragment[]> => {
    const baseUri = options.baseUri ?? playlist.playlistID ?? playlist.uri;
    const primaryPlaylistUri = appendQueryParams(baseUri, playlist.uri);
    const fallbackPlaylistUri =
      primaryPlaylistUri !== playlist.uri ? playlist.uri : null;

    const { uri: usedPlaylistUri, data: levelPlaylistText } =
      await fetchWithFallback(
        primaryPlaylistUri,
        fallbackPlaylistUri,
        fetchAttempts,
        loader.fetchText
      );
    const fragments = parser.parseLevelPlaylist(
      levelPlaylistText,
      usedPlaylistUri
    );

    return fragments.map((fragment) => {
      const primaryUri = appendQueryParams(baseUri, fragment.uri);
      const fallbackUri = primaryUri !== fragment.uri ? fragment.uri : null;
      const keyPrimaryUri = fragment.key.uri
        ? appendQueryParams(baseUri, fragment.key.uri)
        : fragment.key.uri;
      const keyFallbackUri =
        fragment.key.uri && keyPrimaryUri !== fragment.key.uri
          ? fragment.key.uri
          : null;

      return new Fragment(
        new Key(keyPrimaryUri, fragment.key.iv, keyFallbackUri),
        primaryUri,
        fragment.index,
        fallbackUri
      );
    });
  };
  return run;
};
