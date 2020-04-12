import { IParser } from "../services/Parser";
import { Playlist } from "../entities/playlist";
import { Fragment } from "../entities/fragment";
import { ILoader } from "../services/Loader";

export const getFragmentsDetailsFactory = (
  loader: ILoader,
  parser: IParser
) => {
  const run = async (
    playlist: Playlist
  ): Promise<Fragment[]> => {
    const levelPlaylistText = await loader.fetchText(playlist.uri);
    const fragments = parser.parseLevelPlaylist(
      levelPlaylistText,
      playlist.uri,
      playlist.index
    );
    return fragments;
  };
  return run;
};
