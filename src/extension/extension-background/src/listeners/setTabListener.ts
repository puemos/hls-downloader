import { browser } from "webextension-polyfill-ts";
import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { tabsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";

export function setTabListener(store: ReturnType<typeof createStore>) {
  browser.tabs.onActivated.addListener(async (details) => {
    store.dispatch(
      tabsSlice.actions.setTab({
        tab: {
          id: details.tabId,
        },
      })
    );
  });
}
