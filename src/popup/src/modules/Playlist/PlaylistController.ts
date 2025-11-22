import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import {
  levelInspectionsSlice,
  levelsSlice,
  playlistPreferencesSlice,
  ILevelInspectionsState,
  IPlaylistPreferencesState,
} from "@hls-downloader/core/lib/store/slices";
import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouterContext } from "../Navbar/RouterContext";
import { TabOptions } from "../Navbar/types";

interface ReturnType {
  status: PlaylistStatus | null;
  levels: Level[];
  downloadLevel: (
    videoId: string,
    audioLevelID?: string,
    subtitleLevelID?: string,
  ) => void;
  inspections: ILevelInspectionsState;
  preferences: IPlaylistPreferencesState;
  preferredAudioLanguage: string | null;
  setAudioPreference: (levelID: string) => void;
  setSubtitlePreference: (levelID: string) => void;
  inspectLevel: (levelID: string) => void;
}

const usePlaylistController = ({ id }: { id: string }): ReturnType => {
  const { setTab } = useContext(RouterContext);

  const dispatch = useDispatch();

  const status = useSelector<RootState, PlaylistStatus | null>(
    (state) => state.playlists.playlistsStatus[id],
  );
  const inspections = useSelector<RootState, ILevelInspectionsState>(
    (state) => state.levelInspections,
  );
  const preferences = useSelector<RootState, IPlaylistPreferencesState>(
    (state) => state.playlistPreferences,
  );
  const preferredAudioLanguage = useSelector<RootState, string | null>(
    (state) => state.config.preferredAudioLanguage,
  );
  const levels = useSelector<RootState, Level[]>((state) => {
    const list = Object.values(state.levels.levels)
      .flatMap((f) => (f ? [f] : []))
      .filter((l) => l?.playlistID === id);

    list.sort((a, b) => b?.bitrate! - a?.bitrate!);

    return list;
  });

  const downloadLevel = useCallback(
    (levelId: string, audioLevelID?: string, subtitleLevelID?: string) => {
      dispatch(
        levelsSlice.actions.download({
          levelID: levelId,
          audioLevelID,
          subtitleLevelID,
        }),
      );
      setTab(TabOptions.DOWNLOADS);
    },
    [dispatch, setTab],
  );
  return {
    status,
    levels,
    downloadLevel,
    inspections,
    preferences,
    preferredAudioLanguage,
    setAudioPreference: useCallback(
      (levelID: string) => {
        dispatch(
          playlistPreferencesSlice.actions.setAudioSelection({
            playlistID: id,
            levelID,
          }),
        );
      },
      [dispatch, id],
    ),
    setSubtitlePreference: useCallback(
      (levelID: string) => {
        dispatch(
          playlistPreferencesSlice.actions.setSubtitleSelection({
            playlistID: id,
            levelID,
          }),
        );
      },
      [dispatch, id],
    ),
    inspectLevel: useCallback(
      (levelID: string) => {
        dispatch(
          levelInspectionsSlice.actions.inspect({
            levelId: levelID,
          }),
        );
      },
      [dispatch],
    ),
  };
};

export default usePlaylistController;
