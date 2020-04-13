import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { downloadsActions } from "@hls-downloader/core/lib/adapters/redux/slices";
import Playlist from "./Playlist";

function App() {
  const dispatch = useDispatch();
  const [uri, setURI] = useState(
    "http://s2.content.video.llnw.net/smedia/42f4e71183054396907c0dea18241568/Eg/o_fUnlyL800wzDHxFl6hhw-8UQc-ooyDeghAFJJhc/francstireurs_entrevue_ep472_seq24.mpegts/playlist-d4a7a4f0ec6d5166035d24a010a67a11eca19cf4.m3u8"
  );
  function onURIInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setURI(e.target.value);
  }
  function onDownloadPlaylistClick() {
    dispatch(
      downloadsActions.downloadPlaylist({
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
