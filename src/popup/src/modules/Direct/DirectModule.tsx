import React from "react";
import DirectView from "./DirectView";
import useDirectController from "./DirectController";

const DirectModule = () => {
  const {
    clearPlaylists,
    setFilter,
    filter,
    setCurrentPlaylistId,
    playlists,
    currentPlaylistId,
    addDirectPlaylist,
    directURI,
    setDirectURI,
  } = useDirectController();

  return (
    <DirectView
      filter={filter}
      clearPlaylists={clearPlaylists}
      setFilter={setFilter}
      setCurrentPlaylistId={setCurrentPlaylistId}
      playlists={playlists}
      currentPlaylistId={currentPlaylistId}
      addDirectPlaylist={addDirectPlaylist}
      directURI={directURI}
      setDirectURI={setDirectURI}
    ></DirectView>
  );
};

export default DirectModule;
