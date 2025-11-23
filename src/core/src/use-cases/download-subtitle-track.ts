import { Level, Playlist } from "../entities";
import { IFS, ILoader, IParser } from "../services";
import { getFragmentsDetailsFactory } from "./get-fragments-details";
import { generateSubtitleFileName } from "./generate-subtitle-file-name";
import { appendQueryParams } from "../utils/url";
import { fetchWithFallback } from "../utils/fetch";

export const downloadSubtitleTrackFactory = (
  loader: ILoader,
  parser: IParser,
  fs: IFS
) => {
  const run = async (
    level: Level,
    playlist: Playlist,
    fetchAttempts: number,
    dialog: boolean,
    options: { baseUri?: string } = {}
  ): Promise<string> => {
    const baseUri = options.baseUri ?? playlist.uri;
    const fragments = await getFragmentsDetailsFactory(loader, parser)(
      level,
      fetchAttempts,
      {
        baseUri,
      }
    );

    const hasFragments = fragments.length > 0;
    const textParts: string[] = [];

    if (hasFragments) {
      for (const fragment of fragments) {
        const { data: fragmentText } = await fetchWithFallback(
          fragment.uri,
          fragment.fallbackUri,
          fetchAttempts,
          loader.fetchText
        );
        textParts.push(fragmentText.trim());
      }
    } else {
      const levelUri = appendQueryParams(baseUri, level.uri);
      const { data: subtitleText } = await fetchWithFallback(
        levelUri,
        level.uri,
        fetchAttempts,
        loader.fetchText
      );
      textParts.push(subtitleText.trim());
    }

    const fileName = generateSubtitleFileName()(playlist, level);
    const link = URL.createObjectURL(
      new Blob([textParts.join("\n\n")], { type: "text/vtt" })
    );

    try {
      await fs.saveAs(fileName, link, { dialog });
    } finally {
      URL.revokeObjectURL(link);
    }
    return fileName;
  };

  return run;
};
