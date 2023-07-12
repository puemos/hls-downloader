import { Fragment, Level } from "../entities";
import { ILoader, IParser } from "../services";

export const getFragmentsDetailsFactory = (
  loader: ILoader,
  parser: IParser
) => {
  const run = async (
    playlist: Level,
    fetchAttempts: number
  ): Promise<Fragment[]> => {
    const levelPlaylistText = await loader.fetchText(playlist.uri, fetchAttempts);
    const fragments = parser.parseLevelPlaylist(
      levelPlaylistText,
      playlist.uri,
    );
    return fragments;
  };
  return run;
};
