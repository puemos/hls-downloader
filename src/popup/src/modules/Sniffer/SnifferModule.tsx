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
    ></SnifferView>
  );
};

export default SnifferModule;
