import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { addPlaylistListener } from "./addPlaylistListener";
import { setTabListener } from "./setTabListener";
import { setProxyListener } from "./setProxyListener";

export function subscribeListeners(store: ReturnType<typeof createStore>) {
  setTabListener(store);
  addPlaylistListener(store);
  setProxyListener(store);
}
