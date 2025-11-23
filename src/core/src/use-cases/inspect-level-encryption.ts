import { Level, LevelInspection } from "../entities";
import { ILoader, IParser } from "../services";
import { appendQueryParams } from "../utils/url";
import { fetchWithFallback } from "../utils/fetch";

const SUPPORTED_METHODS = ["AES-128"];

export const inspectLevelEncryptionFactory = (
  loader: ILoader,
  parser: IParser
) => {
  const run = async (
    level: Level,
    fetchAttempts: number,
    options: { baseUri?: string } = {}
  ): Promise<LevelInspection> => {
    const baseUri = options.baseUri ?? level.playlistID ?? level.uri;
    const primaryLevelUri = appendQueryParams(baseUri, level.uri);
    const { data: playlistText, uri: usedUri } = await fetchWithFallback(
      primaryLevelUri,
      level.uri,
      fetchAttempts,
      loader.fetchText
    );
    const { methods, keyUris, iv } = parser.inspectLevelEncryption(
      playlistText,
      usedUri
    );
    const method = methods.length > 0 ? methods[0] : null;
    const supported = method === null || SUPPORTED_METHODS.includes(method);
    const normalizedKeyUris = keyUris.map((uri) =>
      appendQueryParams(baseUri, uri)
    );

    return {
      levelId: level.id,
      playlistId: level.playlistID,
      method,
      keyUris: normalizedKeyUris,
      iv: iv ?? null,
      supported,
      message: supported
        ? undefined
        : method
        ? `Unsupported encryption method: ${method}`
        : "Unsupported encryption method detected",
    };
  };
  return run;
};
