import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { levelsSlice } from "@hls-downloader/core/lib/store/slices";
import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouterContext } from "../Navbar/RouterContext";
import { TabOptions } from "../Navbar/types";

interface ReturnType {
  status: PlaylistStatus | null;
  levels: Level[];
  downloadLevel: (videoId: string, audioLevelID?: string) => void;
}

const usePlaylistController = ({ id }: { id: string }): ReturnType => {
  const { setTab } = useContext(RouterContext);

  const dispatch = useDispatch();

  const status = useSelector<RootState, PlaylistStatus | null>(
    (state) => state.playlists.playlistsStatus[id],
  );
  const levels = useSelector<RootState, Level[]>((state) => {
    const list = Object.values(state.levels.levels)
      .flatMap((f) => (f ? [f] : []))
      .filter((l) => l?.playlistID === id);

    list.sort((a, b) => b?.bitrate! - a?.bitrate!);

    return list;
  });

  function downloadLevel(levelId: string, audioLevelID?: string) {
    dispatch(levelsSlice.actions.download({ levelID: levelId, audioLevelID }));
    setTab(TabOptions.DOWNLOADS);
  }
  return {
    status,
    levels,
    downloadLevel,
  };
};

export default usePlaylistController;
