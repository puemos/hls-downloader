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
