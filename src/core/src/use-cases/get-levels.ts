import { Level } from "../entities";
import { ILoader, IParser } from "../services";

export const getLevelsFactory = (loader: ILoader, parser: IParser) => {
  const run = async (masterPlaylistURI: string): Promise<Level[]> => {
    const masterPlaylistText = await loader.fetchText(masterPlaylistURI);
    return parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
  };
  return run;
};
