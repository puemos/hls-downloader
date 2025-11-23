import { Playlist, Level } from "../entities";

type GenerateFileNameOptions = {
  container?: "mp4" | "mkv";
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
      ? `${playlist.pageTitle}-${playlistFilenameWithoutExt}.${container}`
      : `${playlistFilenameWithoutExt}.${container}`;

    return filename.normalize("NFC");
  };
  return run;
};
