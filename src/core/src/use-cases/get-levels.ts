import { Level } from "../entities";
import { ILoader, IParser } from "../services";

export const getLevelsFactory = (loader: ILoader, parser: IParser) => {
  const run = async (
    masterPlaylistURI: string,
    fetchAttempts: number,
  ): Promise<Level[]> => {
    try {
      const masterPlaylistText = await loader.fetchText(
        masterPlaylistURI,
        fetchAttempts,
      );
      const levels = parser.parseMasterPlaylist(
        masterPlaylistText,
        masterPlaylistURI,
      );
      if (levels.length > 0) return levels;
      // A media playlist is also a valid entry point. Keep its complete URI,
      // including authentication parameters, instead of requiring a master.
      if (
        /^\uFEFF?#EXTM3U(?:\r?\n|$)/.test(masterPlaylistText) &&
        parser.parseLevelPlaylist(masterPlaylistText, masterPlaylistURI)
          .length > 0
      ) {
        return [
          {
            type: "stream",
            id: JSON.stringify(["media-playlist", masterPlaylistURI]),
            playlistID: masterPlaylistURI,
            uri: masterPlaylistURI,
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
