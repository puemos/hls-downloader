import { Level, Playlist } from "../entities";
import { IFS, ILoader, IParser } from "../services";
import { getFragmentsDetailsFactory } from "./get-fragments-details";
import { generateSubtitleFileName } from "./generate-subtitle-file-name";

export const downloadSubtitleTrackFactory = (
  loader: ILoader,
  parser: IParser,
  fs: IFS
) => {
  const run = async (
    level: Level,
    playlist: Playlist,
    fetchAttempts: number,
    dialog: boolean
  ): Promise<string> => {
    const fragments = await getFragmentsDetailsFactory(loader, parser)(
      level,
      fetchAttempts
    );

    const hasFragments = fragments.length > 0;
    const textParts: string[] = [];

    if (hasFragments) {
      for (const fragment of fragments) {
        const fragmentText = await loader.fetchText(
          fragment.uri,
          fetchAttempts
        );
        textParts.push(fragmentText.trim());
      }
    } else {
      const subtitleText = await loader.fetchText(level.uri, fetchAttempts);
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
