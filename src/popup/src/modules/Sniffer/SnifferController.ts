import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import {
  levelsSlice,
  playlistsSlice,
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
  copyPlaylistsToClipboard: () => void;
  directURI: string;
  setDirectURI: (uri: string) => void;
  addDirectPlaylist: () => void;
  expandedPlaylists: string[];
  toggleExpandedPlaylist: (id: string) => void;
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

function isPlaylist(playlist: Playlist | null): playlist is Playlist {
  return playlist !== null;
}

const useSnifferController = (): ReturnType => {
  const [currentPlaylistId, setCurrentPlaylistId] = useState<
    string | undefined
  >(undefined);
  const [filter, setFilter] = useState("");
  const [directURI, setDirectURI] = useState("");
  const [expandedPlaylists, setExpandedPlaylists] = useState<string[]>([]);
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

  function addDirectPlaylist() {
    if (!directURI) return;
    dispatch(
      playlistsSlice.actions.addPlaylist({
        id: directURI,
        uri: directURI,
        createdAt: Date.now(),
        initiator: "Direct",
      })
    );
    setCurrentPlaylistId(directURI);
  }

  const playlists = Object.values(playlistsRecord)
    .filter(isPlaylist)
    .filter(
      (playlist) =>
        playlistsStatusRecord[playlist.id]?.status === "ready" ||
        playlist.initiator === "Direct"
    )
    .filter(playlistFilter(filter));

  playlists.sort((a, b) => b.createdAt - a.createdAt);

  function toggleExpandedPlaylist(id: string) {
    setExpandedPlaylists((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }

  function copyPlaylistsToClipboard() {
    const playlistUris = playlists.map((p) => p.uri).join("\n");
    navigator.clipboard.writeText(playlistUris);
  }

  return {
    filter,
    clearPlaylists,
    setFilter,
    setCurrentPlaylistId,
    playlists,
    currentPlaylistId,
    copyPlaylistsToClipboard,
    directURI,
    setDirectURI,
    addDirectPlaylist,
    expandedPlaylists,
    toggleExpandedPlaylist,
  };
};

export default useSnifferController;
