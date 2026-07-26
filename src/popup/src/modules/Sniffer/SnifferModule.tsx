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
    hasPlaylists,
    currentPlaylistId,
    copyPlaylistsToClipboard,
    removePlaylist,
    directURI,
    setDirectURI,
    addDirectPlaylist,
  } = useSnifferController();

  return (
    <SnifferView
      filter={filter}
      clearPlaylists={clearPlaylists}
      removePlaylist={removePlaylist}
      copyPlaylistsToClipboard={copyPlaylistsToClipboard}
      setFilter={setFilter}
      setCurrentPlaylistId={setCurrentPlaylistId}
      playlists={playlists}
      hasPlaylists={hasPlaylists}
      currentPlaylistId={currentPlaylistId}
      directURI={directURI}
      setDirectURI={setDirectURI}
      addDirectPlaylist={addDirectPlaylist}
    ></SnifferView>
  );
};

export default SnifferModule;
