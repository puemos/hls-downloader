import { Parser } from "../services/Parser";
import { Level } from "../entities/level";
import { Loader } from "../services/Loader";

export const getLevelsFactory = (loader: Loader, parser: Parser) => {
  const run = async (masterPlaylistURI: string): Promise<Level[]> => {
    const masterPlaylistText = await loader.fetchText(masterPlaylistURI);
    return parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
  };
  return run;
};
