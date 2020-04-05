import { IParser } from "../services/Parser";
import { Playlist } from "../entities/playlist";
import { ILoader } from "../services/Loader";

export const getLevelsFactory = (loader: ILoader, parser: IParser) => {
  const run = async (masterPlaylistURI: string): Promise<Playlist[]> => {
    const masterPlaylistText = await loader.fetchText(masterPlaylistURI);
    return parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
  };
  return run;
};
