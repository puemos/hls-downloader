import { Playlist, Level } from "../entities";

export const generateFileName = () => {
  const run = (playlist: Playlist, level: Level): string => {
    const path = playlist.uri.split("?")[0];
    const chunks = path.split("/");
    const playlistFilename = chunks[chunks.length - 1];
    const playlistFilenameWithoutExt = playlistFilename.split(".m3u8")[0];

    const filename = playlist.pageTitle
      ? `${playlist.pageTitle}-${playlistFilenameWithoutExt}.mp4`
      : `${playlistFilenameWithoutExt}.mp4`;

    return filename.normalize("NFC");
  };
  return run;
};
