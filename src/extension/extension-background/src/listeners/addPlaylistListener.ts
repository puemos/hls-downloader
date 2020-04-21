import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { playlistsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { browser } from "webextension-polyfill-ts";

export function addPlaylistListener(store: ReturnType<typeof createStore>) {
  browser.webRequest.onResponseStarted.addListener(
    async (details) => {
      if (details.tabId < 0) {
        return;
      }
      const tab = await browser.tabs.get(details.tabId);

      await browser.browserAction.setIcon({
        tabId: tab.id,
        path: {
          "16": "assets/icons/16-new.png",
          "48": "assets/icons/48-new.png",
          "128": "assets/icons/128-new.png",
          "256": "assets/icons/256-new.png",
        },
      });
      store.dispatch(
        playlistsSlice.actions.addPlaylist({
          id: details.url,
          uri: details.url,
          initiator: tab.url,
          pageTitle: tab.title,
          createdAt: Date.now(),
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
