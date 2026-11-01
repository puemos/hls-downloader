import { Level, Playlist } from "../entities";
import { buildFilename } from "./build-filename";
import { sanitizeFilename } from "./sanitize-filename";

export const generateSubtitleFileName = () => {
  const run = (playlist: Playlist, level: Level): string => {
    const baseTitle = sanitizeFilename(playlist.pageTitle ?? "") || "subtitle";

    const language = level.language || level.name || level.id || "track";
    const sanitizedLanguage = `${language}`.replace(/\s+/g, "-");

    return (
      buildFilename(`${baseTitle}-${sanitizedLanguage}`, "vtt") ??
      "subtitle.vtt"
    );
  };
  return run;
};
