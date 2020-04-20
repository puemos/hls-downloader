import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { addPlaylistListener } from "./addPlaylistListener";
import { setTabListener } from "./setTabListener";

export function subscribeListeners(store: ReturnType<typeof createStore>) {
  setTabListener(store);
  addPlaylistListener(store);
}
