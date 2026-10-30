import { Level } from "../entities";
import { IDecryptor, ILoader, IParser } from "../services";
import { parseFragmentsDetails } from "./get-fragments-details";
import { getPlaylistDocumentFactory } from "./get-playlist-document";
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
    const document = await getPlaylistDocumentFactory(loader)(
      level,
      fetchAttempts,
      options,
    );
    // Direct WebVTT has already been fetched. Repeating that request can expire
    // signed or single-use caption URLs even though the first response was valid.
    if (/^\uFEFF?WEBVTT(?:[ \t].*)?(?:\r?\n|$)/.test(document.text)) {
      return document.text.trim();
    }
    const fragments = parseFragmentsDetails(document, parser, ["AES-128"]);

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
      parts.push(document.text.trim());
    }

    return parts.join("\n\n");
  };

  return run;
};
