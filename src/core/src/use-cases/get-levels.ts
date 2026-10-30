import { Level } from "../entities";
import { ILoader, IParser } from "../services";
import { loadPlaylistText } from "./get-playlist-document";

export const getLevelsFactory = (loader: ILoader, parser: IParser) => {
  const run = async (
    masterPlaylistURI: string,
    fetchAttempts: number,
  ): Promise<Level[]> => {
    try {
      const { text: masterPlaylistText, uri: responseURI } =
        await loadPlaylistText(loader, masterPlaylistURI, fetchAttempts);
      const redirected = responseURI !== masterPlaylistURI;
      const levels = redirected
        ? parser.parseMasterPlaylist(
            masterPlaylistText,
            responseURI,
            masterPlaylistURI,
          )
        : parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
      if (levels.length > 0)
        return redirected
          ? levels.map((level) => ({ ...level, baseUri: responseURI }))
          : levels;
      // A media playlist is also a valid entry point. Keep its complete URI,
      // including authentication parameters, instead of requiring a master.
      if (
        /^\uFEFF?#EXTM3U(?:\r?\n|$)/.test(masterPlaylistText) &&
        parser.parseLevelPlaylist(masterPlaylistText, responseURI).length > 0
      ) {
        return [
          {
            type: "stream",
            id: JSON.stringify(["media-playlist", masterPlaylistURI]),
            playlistID: masterPlaylistURI,
            uri: responseURI,
            ...(redirected ? { baseUri: responseURI } : {}),
            name: "Original stream",
          },
        ];
      }
      return [];
    } catch (error) {
      throw Error("LevelManifest");
    }
  };
  return run;
};
