import { Playlist, Level } from "../entities";

export const generateFileName = () => {
  const run = (playlist: Playlist, level: Level): string => {
    const path = playlist.uri.split("?")[0];
    const chunks = path.split("/");
    const playlistFilename = chunks[chunks.length - 1];
    const playlistFilenameWithoutExt = playlistFilename.split(".m3u8")[0];

    if (playlist.pageTitle) {
      return `${playlist.pageTitle}-${playlistFilenameWithoutExt}.ts`;
    }
    return `${playlistFilenameWithoutExt}.ts`;
  };
  return run;
};
