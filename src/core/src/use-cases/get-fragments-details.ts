import { Fragment, Key, Level } from "../entities";
import { ILoader, IParser } from "../services";
import { appendQueryParams } from "../utils/url";
import {
  getPlaylistDocumentFactory,
  PlaylistDocument,
} from "./get-playlist-document";

export interface GetFragmentsDetailsOptions {
  baseUri?: string;
  supportedEncryptionMethods?: readonly string[];
}

export function parseFragmentsDetails(
  { text, uri, baseUri }: PlaylistDocument,
  parser: IParser,
  supportedEncryptionMethods?: readonly string[],
): Fragment[] {
  if (supportedEncryptionMethods) {
    const { methods } = parser.inspectLevelEncryption(text, uri);
    const unsupported = methods.find(
      (method) => !supportedEncryptionMethods!.includes(method),
    );
    if (unsupported)
      throw new Error(`Unsupported subtitle encryption method: ${unsupported}`);
  }
  const fragments = parser.parseLevelPlaylist(text, uri);

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
      fallbackUri,
      fragment.byteRange,
    );
  });
}

export const getFragmentsDetailsFactory = (
  loader: ILoader,
  parser: IParser,
) => {
  return async (
    playlist: Level,
    fetchAttempts: number,
    options: GetFragmentsDetailsOptions = {},
  ): Promise<Fragment[]> => {
    const document = await getPlaylistDocumentFactory(loader)(
      playlist,
      fetchAttempts,
      options,
    );
    return parseFragmentsDetails(
      document,
      parser,
      options.supportedEncryptionMethods,
    );
  };
};
