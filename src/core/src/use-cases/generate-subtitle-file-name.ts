import { Level, Playlist } from "../entities";

export const generateSubtitleFileName = () => {
  const run = (playlist: Playlist, level: Level): string => {
    const baseTitle =
      playlist.pageTitle && playlist.pageTitle.trim().length > 0
        ? playlist.pageTitle
        : "subtitle";

    const language = level.language || level.name || level.id || "track";
    const sanitizedLanguage = `${language}`.replace(/\s+/g, "-");

    const filename = `${baseTitle}-${sanitizedLanguage}.vtt`;
    return filename.normalize("NFC");
  };
  return run;
};
