import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { wrapStore } from "webext-redux";
import { subscribeListeners } from "./listeners";
import { getState, saveState } from "./persistState";
import { CryptoDecryptor } from "./services/crypto-decryptor";
import { FetchLoader } from "./services/fetch-loader";
import { InMemoryFS } from "./services/in-memory-fs";
import { M3u8Parser } from "./services/m3u8-parser";

(async () => {
  const state = await getState();
  const store = createStore(
    {
      decryptor: CryptoDecryptor,
      fs: InMemoryFS,
      loader: FetchLoader,
      parser: M3u8Parser,
    },
    state
  );

  wrapStore(store);

  store.subscribe(() => {
    saveState(store.getState());
  });

  subscribeListeners(store);
})();
