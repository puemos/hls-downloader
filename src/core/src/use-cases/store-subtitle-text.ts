import { IFS } from "../services";
import { Level, Playlist } from "../entities";

export const storeSubtitleTextFactory = (fs: IFS) => {
  const run = async (
    bucketId: string,
    level: Pick<Level, "language" | "name" | "id">,
    playlist: Pick<Playlist, "pageTitle" | "uri">,
    text: string,
  ): Promise<void> => {
    console.log("[subtitle] store-subtitle-text", {
      bucketId,
      levelId: level.id,
      hasText: text !== undefined && text !== null,
      textLength: text?.length ?? 0,
    });
    const language = level.language;
    const name =
      level.name ||
      language ||
      playlist.pageTitle ||
      playlist.uri.split("/").pop() ||
      "subtitle";
    try {
      await fs.setSubtitleText(bucketId, { text, language, name });
    } catch (error) {
      console.error("[subtitle] setSubtitleText failed", error);
      throw error;
    }
  };
  return run;
};
