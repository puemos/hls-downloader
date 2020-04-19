import { browser } from "webextension-polyfill-ts";
import { CryptoDecryptor } from "./services/crypto-decryptor";
import { InMemoryFS } from "./services/in-memory-fs";
import { FetchLoader } from "./services/fetch-loader";
import { M3u8Parser } from "./services/m3u8-parser";
import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { wrapStore } from "webext-redux";
import { playlistsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";

const store = createStore({
  decryptor: CryptoDecryptor,
  fs: InMemoryFS,
  loader: FetchLoader,
  parser: M3u8Parser,
});

wrapStore(store);

browser.webRequest.onResponseStarted.addListener(
  async (details) => {
    console.log(details);
    if (details.tabId < 0) {
      return;
    }
    const tab = await browser.tabs.get(details.tabId);
    store.dispatch(
      playlistsSlice.actions.addPlaylist({
        id: details.url,
        uri: details.url,
        initiator: tab.url,
        pageTitle: tab.title,
      })
    );
  },
  {
    types: ["xmlhttprequest"],
    urls: [
      "http://*/*.m3u8",
      "https://*/*.m3u8",
      "http://*/*.m3u8?*",
      "https://*/*.m3u8?*",
    ],
  }
);
