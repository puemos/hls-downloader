import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Store } from "webext-redux";
import App from "./App";

import { Store as IStore } from "@hls-downloader/core/lib/store/configure-store";

import "./index.css";

(async () => {
  const store = new Store();

  await store.ready();

  const root = document.querySelector("#root");

  ReactDOM.createRoot(root!).render(
    <Provider store={store as IStore}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>
  );
})();
