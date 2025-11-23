import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { playlistsSlice } from "@hls-downloader/core/lib/store/slices";
import {
  webRequest,
  tabs,
  browserAction as actiobV2,
  action as actiobV3,
} from "webextension-polyfill";

export function addPlaylistListener(store: ReturnType<typeof createStore>) {
  webRequest.onCompleted.addListener(
    async (details) => {
      if (details.tabId < 0) {
        return;
      }

      const contentTypeHeader = details.responseHeaders?.find(
        (h) => h.name.toLowerCase() === "content-type"
      );

      const contentType = contentTypeHeader?.value?.toLowerCase() || "";

      if (
        !contentType.includes("application/vnd.apple.mpegurl") &&
        !contentType.includes("application/x-mpegurl")
      ) {
        return;
      }

      if (
        details.statusCode &&
        (details.statusCode < 200 || details.statusCode >= 300)
      ) {
        return;
      }

      const playlistExists =
        !!store.getState().playlists.playlists[details.url];

      if (playlistExists) {
        return;
      }
      const tab = await tabs.get(details.tabId);

      store.dispatch(
        playlistsSlice.actions.addPlaylist({
          id: details.url,
          uri: details.url,
          initiator: tab.url,
          pageTitle: tab.title,
          createdAt: Date.now(),
        })
      );

      const unsubscribe = store.subscribe(() => {
        const status =
          store.getState().playlists.playlistsStatus[details.url]?.status;
        if (status === "ready") {
          const action = actiobV2 || actiobV3;
          void action.setIcon({
            tabId: tab.id,
            path: {
              "16": "assets/icons/16-new.png",
              "48": "assets/icons/48-new.png",
              "128": "assets/icons/128-new.png",
              "256": "assets/icons/256-new.png",
            },
          });
          unsubscribe();
        } else if (status === "error") {
          unsubscribe();
        }
      });
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
    ["responseHeaders"]
  );
}
