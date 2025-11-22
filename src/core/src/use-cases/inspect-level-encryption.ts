import { Level, LevelInspection } from "../entities";
import { ILoader, IParser } from "../services";

const SUPPORTED_METHODS = ["AES-128"];

export const inspectLevelEncryptionFactory = (
  loader: ILoader,
  parser: IParser,
) => {
  const run = async (
    level: Level,
    fetchAttempts: number,
  ): Promise<LevelInspection> => {
    const playlistText = await loader.fetchText(level.uri, fetchAttempts);
    const { methods, keyUris, iv } = parser.inspectLevelEncryption(
      playlistText,
      level.uri,
    );
    const method = methods.length > 0 ? methods[0] : null;
    const supported = method === null || SUPPORTED_METHODS.includes(method);

    return {
      levelId: level.id,
      playlistId: level.playlistID,
      method,
      keyUris,
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
