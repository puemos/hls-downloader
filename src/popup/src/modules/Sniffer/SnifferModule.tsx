import React from "react";
import SnifferView from "./SnifferView";
import useSnifferController from "./SnifferController";

const SnifferModule = () => {
  const {
    clearPlaylists,
    setFilter,
    filter,
    setCurrentPlaylistId,
    playlists,
    currentPlaylist,
    currentPlaylistStatus,
    currentPlaylistId,
    copyPlaylistsToClipboard,
    directURI,
    setDirectURI,
    addDirectPlaylist,
    expandedPlaylists,
    toggleExpandedPlaylist,
  } = useSnifferController();

  return (
    <SnifferView
      filter={filter}
      clearPlaylists={clearPlaylists}
      copyPlaylistsToClipboard={copyPlaylistsToClipboard}
      setFilter={setFilter}
      setCurrentPlaylistId={setCurrentPlaylistId}
      playlists={playlists}
      currentPlaylist={currentPlaylist}
      currentPlaylistStatus={currentPlaylistStatus}
      currentPlaylistId={currentPlaylistId}
      directURI={directURI}
      setDirectURI={setDirectURI}
      addDirectPlaylist={addDirectPlaylist}
      expandedPlaylists={expandedPlaylists}
      toggleExpandedPlaylist={toggleExpandedPlaylist}
    ></SnifferView>
  );
};

export default SnifferModule;
