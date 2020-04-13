import React from "react";
import ReactDOM from "react-dom";
import App from "./view/App";
import { Provider } from "react-redux";
import { createStore } from "@hls-downloader/core/lib/adapters/redux/configureStore";
import * as serviceWorker from "./serviceWorker";
import { CryptoDecryptor } from "./services/CryptoDecryptor";
import { InMemoryFS } from "./services/InMemoryFS";
import { Fetch } from "./services/Fetch";
import { M3u8Parser } from "./services/M3u8Parser";
//http://s2.content.video.llnw.net/smedia/42f4e71183054396907c0dea18241568/Eg/o_fUnlyL800wzDHxFl6hhw-8UQc-ooyDeghAFJJhc/francstireurs_entrevue_ep472_seq24.mpegts/playlist-d4a7a4f0ec6d5166035d24a010a67a11eca19cf4.m3u8
ReactDOM.render(
  <Provider
    store={createStore({
      config: { concurrency: 3 },
      decryptor: CryptoDecryptor,
      fs: InMemoryFS,
      loader: Fetch,
      parser: M3u8Parser,
    })}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
