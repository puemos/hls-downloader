import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { playlistsSlice } from "@hls-downloader/core/lib/store/slices";
import {
  webRequest,
  tabs,
  browserAction as actionV2,
  action as actionV3,
} from "webextension-polyfill";

export function addPlaylistListener(store: ReturnType<typeof createStore>) {
  webRequest.onResponseStarted.addListener(
    async (details) => {
      if (details.tabId < 0) {
        return;
      }
      const tab = await tabs.get(details.tabId);
      const action = actionV2 || actionV3;
      await action.setIcon({
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
        }),
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
    },
  );
}
