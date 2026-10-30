import { Level, Playlist } from "../entities";
import { IDecryptor, IFS, ILoader, IParser } from "../services";
import { getSubtitleTextFactory } from "./get-subtitle-text";
import { generateSubtitleFileName } from "./generate-subtitle-file-name";

export const downloadSubtitleTrackFactory = (
  loader: ILoader,
  parser: IParser,
  fs: IFS,
  decryptor?: IDecryptor,
) => {
  const run = async (
    level: Level,
    playlist: Playlist,
    fetchAttempts: number,
    dialog: boolean,
    options: { baseUri?: string } = {},
  ): Promise<string> => {
    const baseUri = options.baseUri ?? playlist.uri;
    const text = await getSubtitleTextFactory(loader, parser, decryptor)(
      level,
      fetchAttempts,
      { baseUri },
    );

    const fileName = generateSubtitleFileName()(playlist, level);
    const download = await fs.prepareTextDownload(text, "text/vtt");
    await fs.saveAs(fileName, download, { dialog });
    return fileName;
  };

  return run;
};
