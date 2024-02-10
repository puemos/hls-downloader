import { storage } from "webextension-polyfill";
import { RootState } from "@hls-downloader/core/lib/store";

export async function saveState(state: RootState) {
  if (!state) {
    return;
  }
  await storage.local.set({ state });
}

export async function getState(): Promise<RootState | undefined> {
  const res = await storage.local.get(["state"]);
  const state: RootState = res.state;
  if (!state) {
    return;
  }
  return {
    config: state.config,
  };
}
