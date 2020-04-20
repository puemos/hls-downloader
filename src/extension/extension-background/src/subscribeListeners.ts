import { browser } from "webextension-polyfill-ts";
import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { playlistsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";

export function subscribeListeners(store: ReturnType<typeof createStore>) {
  browser.webRequest.onResponseStarted.addListener(
    async (details) => {
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
}
