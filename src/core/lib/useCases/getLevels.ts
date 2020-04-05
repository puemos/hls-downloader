import { Parser } from "../services/Parser";
import { Level } from "../entities/level";

export const getLevels = (loader: Loader, parser: Parser) => {
  const run = async (masterPlaylistURI: string): Promise<Level[]> => {
    const masterPlaylistText = await loader.fetchText(masterPlaylistURI);
    return parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
    
  };
  return run;
};
