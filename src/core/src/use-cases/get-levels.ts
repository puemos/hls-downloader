import { Level } from "../entities";
import { ILoader, IParser } from "../services";

export const getLevelsFactory = (loader: ILoader, parser: IParser) => {
  const run = async (
    masterPlaylistURI: string,
    fetchAttempts: number
  ): Promise<Level[]> => {
    try {
      const masterPlaylistText = await loader.fetchText(
        masterPlaylistURI,
        fetchAttempts
      );
      return parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
    } catch (error) {
      throw Error("LevelManifest");
    }
  };
  return run;
};
