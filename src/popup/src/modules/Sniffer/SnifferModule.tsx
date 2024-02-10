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
  } = useSnifferController();

  return (
    <SnifferView
      filter={filter}
      clearPlaylists={clearPlaylists}
      setFilter={setFilter}
      setCurrentPlaylistId={setCurrentPlaylistId}
      playlists={playlists}
      currentPlaylistId={currentPlaylistId}
    ></SnifferView>
  );
};

export default SnifferModule;
