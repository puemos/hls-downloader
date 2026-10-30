import { Level, LevelInspection } from "../entities";
import { ILoader, IParser } from "../services";
import { appendQueryParams } from "../utils/url";
import { getPlaylistDocumentFactory } from "./get-playlist-document";

const SUPPORTED_METHODS = ["AES-128"];

export const inspectLevelEncryptionFactory = (
  loader: ILoader,
  parser: IParser,
) => {
  const run = async (
    level: Level,
    fetchAttempts: number,
    options: { baseUri?: string } = {},
  ): Promise<LevelInspection> => {
    const {
      text: playlistText,
      uri: usedUri,
      baseUri,
    } = await getPlaylistDocumentFactory(loader)(level, fetchAttempts, options);
    const { methods, keyUris, iv } = parser.inspectLevelEncryption(
      playlistText,
      usedUri,
    );
    const method = methods.length > 0 ? methods[0] : null;
    const supported = method === null || SUPPORTED_METHODS.includes(method);
    const normalizedKeyUris = keyUris.map((uri) =>
      appendQueryParams(baseUri, uri),
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
