import React from "react";
import SnifferView from "./SnifferView";
import useSnifferController from "./SnifferController";
import useBulkDownloads from "./useBulkDownloads";

const SnifferModule = () => {
  const {
    clearPlaylists,
    setFilter,
    filter,
    setCurrentPlaylistId,
    playlists,
    capturedPlaylists,
    hasPlaylists,
    currentPlaylistId,
    copyPlaylistsToClipboard,
    removePlaylist,
    directURI,
    setDirectURI,
    addDirectPlaylist,
  } = useSnifferController();
  const bulk = useBulkDownloads(capturedPlaylists, playlists);

  return (
    <SnifferView
      bulk={bulk}
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
