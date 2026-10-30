import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { playlistsSlice } from "@hls-downloader/core/lib/store/slices";
import { isHlsResponse } from "@hls-downloader/core/lib/use-cases";
import {
  webRequest,
  tabs,
  browserAction as actiobV2,
  action as actiobV3,
} from "webextension-polyfill";
import { isBlocked } from "../blocklist";

export function addPlaylistListener(store: ReturnType<typeof createStore>) {
  webRequest.onCompleted.addListener(
    async (details) => {
      if (details.tabId < 0) {
        return;
      }

      // Check if the request initiator is blocked
      if (details.initiator && isBlocked(details.initiator)) {
        return;
      }

      const contentTypeHeader = details.responseHeaders?.find(
        (h) => h.name.toLowerCase() === "content-type",
      );

      const contentType = contentTypeHeader?.value?.toLowerCase() || "";

      if (!isHlsResponse(details.url, contentType)) {
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
      const tab = await tabs.get(details.tabId).catch(() => null);
      if (!tab) return;

      store.dispatch(
        playlistsSlice.actions.addPlaylist({
          id: details.url,
          uri: details.url,
          initiator: tab.url,
          pageTitle: tab.title,
          createdAt: Date.now(),
        }),
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
      types: ["xmlhttprequest", "media"],
      urls: ["http://*/*", "https://*/*"],
    },
    ["responseHeaders"],
  );
}
