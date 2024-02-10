import { tabs } from "webextension-polyfill";
import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { tabsSlice } from "@hls-downloader/core/lib/store/slices";

export function setTabListener(store: ReturnType<typeof createStore>) {
  tabs.onActivated.addListener(async (details) => {
    store.dispatch(
      tabsSlice.actions.setTab({
        tab: {
          id: details.tabId,
        },
      }),
    );
  });
}
