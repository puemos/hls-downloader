import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import {
  levelsSlice,
  playlistsSlice,
} from "@hls-downloader/core/lib/store/slices";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function isPlaylist(playlist: Playlist | null): playlist is Playlist {
  return playlist !== null;
}

const useSnifferController = () => {
  const [currentPlaylistId, setCurrentPlaylistId] = useState<
    string | undefined
  >(undefined);
  const [filter, setFilter] = useState("");
  const [directURI, setDirectURI] = useState("");
  const [currentDirectURI, setCurrentDirectURI] = useState("");
  const dispatch = useDispatch();
  const playlistsRecord = useSelector<
    RootState,
    Record<string, Playlist | null>
  >((state) => state.playlists.playlists);

  function clearPlaylists() {
    dispatch(levelsSlice.actions.clear());
    dispatch(playlistsSlice.actions.clearPlaylists());
  }

  function addDirectPlaylist() {
    setCurrentDirectURI(directURI);
    dispatch(
      playlistsSlice.actions.addPlaylist({
        id: directURI,
        uri: directURI,
        createdAt: Date.now(),
        initiator: "Direct",
      }),
    );
  }

  const playlists = Object.values(playlistsRecord)
    .filter(isPlaylist)
    .filter(({ uri }) => uri === currentDirectURI);

  playlists.sort((a, b) => b.createdAt - a.createdAt);

  return {
    filter,
    clearPlaylists,
    setFilter,
    setCurrentPlaylistId,
    playlists,
    currentPlaylistId,
    addDirectPlaylist,
    directURI,
    setDirectURI,
  };
};

export default useSnifferController;
