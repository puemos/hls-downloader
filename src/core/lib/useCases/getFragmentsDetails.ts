import { Parser } from "../services/Parser";
import { Level } from "../entities/level";
import { Fragment } from "../entities/fragment";
import { Loader } from "../services/Loader";

export const getFragmentsDetailsFactory = (loader: Loader, parser: Parser) => {
  const run = async (level: Level): Promise<Fragment[]> => {
    const levelPlaylistText = await loader.fetchText(level.uri);
    return parser.parseLevelPlaylist(levelPlaylistText, level.uri, level.index);
  };
  return run;
};
