import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { downloadsSlice } from "@hls-downloader/core/lib/adapters/redux/downloadsSlice";
import Playlist from "./Playlist";

function App() {
  const dispatch = useDispatch();
  const [uri, setURI] = useState("");
  function onURIInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setURI(e.target.value);
  }
  function onDownloadPlaylistClick() {
    dispatch(
      downloadsSlice.actions.downloadPlaylist({
        playlist: {
          id: "wow",
          uri,
          index: 0,
        },
      })
    );
  }
  return (
    <div className="App">
      <input type="text" onChange={onURIInputChange} value={uri} />
      <button onClick={() => onDownloadPlaylistClick()}>
        Download Playlist
      </button>
      <Playlist id="wow" />
    </div>
  );
}

export default App;
