import { Level } from "../entities";
import { IDecryptor, ILoader, IParser } from "../services";
import { getFragmentsDetailsFactory } from "./get-fragments-details";
import { appendQueryParams } from "../utils/url";
import { fetchWithFallback } from "../utils/fetch";
import { downloadSingleFactory } from "./download-single-fragment";
import { decryptSingleFragmentFactory } from "./decrypt-single-fragment";

export const getSubtitleTextFactory = (
  loader: ILoader,
  parser: IParser,
  decryptor?: IDecryptor,
) => {
  const run = async (
    level: Level,
    fetchAttempts: number,
    options: { baseUri?: string } = {},
  ): Promise<string> => {
    const baseUri = options.baseUri ?? level.playlistID ?? level.uri;
    const fragments = await getFragmentsDetailsFactory(loader, parser)(
      level,
      fetchAttempts,
      {
        baseUri,
        supportedEncryptionMethods: ["AES-128"],
      },
    );

    const parts: string[] = [];

    if (fragments.length > 0) {
      for (const fragment of fragments) {
        if (fragment.key.uri || fragment.byteRange) {
          const bytes = await downloadSingleFactory(loader)(
            fragment,
            fetchAttempts,
          );
          let clear = bytes;
          if (fragment.key.uri) {
            if (!decryptor || !fragment.key.iv)
              throw new Error("Subtitle decryption is unavailable");
            clear = await decryptSingleFragmentFactory(loader, decryptor)(
              fragment.key,
              bytes,
              fetchAttempts,
            );
          }
          parts.push(
            new TextDecoder("utf-8", { fatal: true }).decode(clear).trim(),
          );
          continue;
        }
        const { data: fragmentText } = await fetchWithFallback(
          fragment.uri,
          fragment.fallbackUri,
          fetchAttempts,
          loader.fetchText,
        );
        parts.push(fragmentText.trim());
      }
    } else {
      const primaryUri = appendQueryParams(baseUri, level.uri);
      const fallbackUri = primaryUri !== level.uri ? level.uri : null;
      const { data: text } = await fetchWithFallback(
        primaryUri,
        fallbackUri,
        fetchAttempts,
        loader.fetchText,
      );
      parts.push(text.trim());
    }

    return parts.join("\n\n");
  };

  return run;
};
