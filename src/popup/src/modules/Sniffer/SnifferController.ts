import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store";
import {
  levelsSlice,
  playlistsSlice
} from "@hls-downloader/core/lib/store/slices";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface ReturnType {
  playlists: Playlist[];
  currentPlaylistId: string | undefined;
  filter: string;
  clearPlaylists: () => void;
  setFilter: (filter: string) => void;
  setCurrentPlaylistId: (playlistId?: string) => void;
}

const playlistFilter =
  (filter: string) =>
  (p: Playlist): boolean => {
    const filterLowerCase = filter.toLocaleLowerCase();
    if (filterLowerCase === "") {
      return true;
    }
    if (p.uri.toLocaleLowerCase().includes(filterLowerCase)) {
      return true;
    }
    if (p.pageTitle?.toLocaleLowerCase().includes(filterLowerCase)) {
      return true;
    }
    if (p.initiator?.toLocaleLowerCase().includes(filterLowerCase)) {
      return true;
    }
    return false;
  };

const useSnifferController = (): ReturnType => {
  const [currentPlaylistId, setCurrentPlaylistId] = useState<
    string | undefined
  >(undefined);
  const [filter, setFilter] = useState("");
  const dispatch = useDispatch();
  const playlistsRecord = useSelector<
    RootState,
    Record<string, Playlist | null>
  >((state) => state.playlists.playlists);
  const playlistsStatusRecord = useSelector<
    RootState,
    Record<string, PlaylistStatus | null>
  >((state) => state.playlists.playlistsStatus);

  function clearPlaylists() {
    dispatch(levelsSlice.actions.clear());
    dispatch(playlistsSlice.actions.clearPlaylists());
  }
  function isPlaylist(playlist: Playlist | null): playlist is Playlist {
    return playlist !== null;
  }
  const playlists = Object.values(playlistsRecord)
    .filter(isPlaylist)
    .filter(
      (playlist) => playlistsStatusRecord[playlist.id]?.status === "ready"
    )
    .filter(playlistFilter(filter));

  playlists.sort((a, b) => b.createdAt - a.createdAt);

  return {
    filter,
    clearPlaylists,
    setFilter,
    setCurrentPlaylistId,
    playlists,
    currentPlaylistId,
  };
};

export default useSnifferController;
