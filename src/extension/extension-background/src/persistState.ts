import { browser } from "webextension-polyfill-ts";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";

export async function saveState(state: RootState) {
  if (!state) {
    return;
  }
  await browser.storage.local.set({ state });
}

export async function getState(): Promise<RootState | undefined> {
  const res = await browser.storage.local.get(["state"]);
  const state: RootState = res.state;
  if (!state) {
    return;
  }
  return {
    config: state.config,
    playlists: {
      playlists: {},
      playlistsStatus: {},
    },
    jobs: {
      jobs: {},
      jobsStatus: {},
    },
    levels: {
      levels: {},
    },
    tabs: {
      current: {
        id: -1,
      },
    },
  };
}
