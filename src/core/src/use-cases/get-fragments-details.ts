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
    const levelPlaylistText = await loader.tryFetchText(playlist.uri, fetchAttempts);
    const fragments = parser.parseLevelPlaylist(
      levelPlaylistText,
      playlist.uri,
      playlist.index
    );
    return fragments;
  };
  return run;
};
