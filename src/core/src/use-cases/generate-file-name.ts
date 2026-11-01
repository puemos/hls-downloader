import { Playlist, Level } from "../entities";
import type { OutputContainer } from "../entities/output-container";
import { buildFilename } from "./build-filename";
import { sanitizeFilename } from "./sanitize-filename";

type GenerateFileNameOptions = {
  container?: OutputContainer;
};

export const generateFileName = () => {
  const run = (
    playlist: Playlist,
    level: Level,
    options?: GenerateFileNameOptions,
  ): string => {
    const path = playlist.uri.split("?")[0];
    const chunks = path.split("/");
    const playlistFilename = chunks[chunks.length - 1];
    const playlistFilenameWithoutExt = playlistFilename.split(".m3u8")[0];
    const container = options?.container ?? "mp4";
    const pageTitle = sanitizeFilename(playlist.pageTitle ?? "");

    const name = pageTitle
      ? `${pageTitle}-${playlistFilenameWithoutExt}`
      : playlistFilenameWithoutExt;

    return buildFilename(name, container) ?? `stream.${container}`;
  };
  return run;
};
