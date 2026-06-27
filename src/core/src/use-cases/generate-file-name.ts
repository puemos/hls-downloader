import { Playlist, Level } from "../entities";
import type { OutputContainer } from "../entities/output-container";
import { sanitizeFilename } from "./sanitize-filename";

type GenerateFileNameOptions = {
  container?: OutputContainer;
};

export const generateFileName = () => {
  const run = (
    playlist: Playlist,
    level: Level,
    options?: GenerateFileNameOptions
  ): string => {
    const path = playlist.uri.split("?")[0];
    const chunks = path.split("/");
    const playlistFilename = chunks[chunks.length - 1];
    const playlistFilenameWithoutExt = playlistFilename.split(".m3u8")[0];
    const container = options?.container ?? "mp4";

    const filename = playlist.pageTitle
      ? `${sanitizeFilename(playlist.pageTitle)}-${playlistFilenameWithoutExt}.${container}`
      : `${playlistFilenameWithoutExt}.${container}`;

    return filename.normalize("NFC");
  };
  return run;
};
