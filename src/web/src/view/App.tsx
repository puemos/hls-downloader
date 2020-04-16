import React, { useState } from "react";
import { useDispatch } from "react-redux";
import PlaylistView from "./PlaylistView";
import { playlistsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";

function App() {
  const dispatch = useDispatch();
  const [uri, setURI] = useState(
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
  );
  function onURIInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setURI(e.target.value);
  }
  function onDownloadPlaylistClick() {
    dispatch(
      playlistsSlice.actions.fetchPlaylistLevels({
        playlistID: uri,
        uri,
      })
    );
  }
  return (
    <div className="App">
      <input type="text" onChange={onURIInputChange} value={uri} />
      <button onClick={() => onDownloadPlaylistClick()}>
        Download Playlist
      </button>
      <PlaylistView id={uri} />
    </div>
  );
}

export default App;
