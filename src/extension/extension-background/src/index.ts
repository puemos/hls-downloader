import { browser } from "webextension-polyfill-ts";
import { CryptoDecryptor } from "./services/crypto-decryptor";
import { InMemoryFS } from "./services/in-memory-fs";
import { FetchLoader } from "./services/fetch-loader";
import { M3u8Parser } from "./services/m3u8-parser";
import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { wrapStore } from "webext-redux";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { subscribeListeners } from "./subscribeListeners";
import { LevelStatus } from "@hls-downloader/core/lib/entities";

async function saveState(state: RootState) {
  if (!state) {
    return;
  }
  await browser.storage.local.set({ state });
}
async function getState(): Promise<RootState | undefined> {
  const res = await browser.storage.local.get(["state"]);
  const state: RootState = res.state;
  if (!state) {
    return;
  }
  return {
    config: state.config,
    playlists: {
      playlists: {},
      playlistsStatus: {},
    },
    levels: {
      levels: {},
      levelsStatus: {},
    },
  };
}

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
