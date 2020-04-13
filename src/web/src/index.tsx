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

ReactDOM.render(
  <Provider
    store={createStore({
      config: { concurrency: 1 },
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
