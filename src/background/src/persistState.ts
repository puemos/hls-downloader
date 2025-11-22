import { storage } from "webextension-polyfill";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";

export async function saveState(state: RootState) {
  if (!state) {
    return;
  }
  await storage.local.set({ state });
}

export async function getState(): Promise<Partial<RootState> | undefined> {
  const res = await storage.local.get(["state"]);
  const state: RootState = res.state;
  if (!state) {
    return;
  }
  const preferredAudioLanguage =
    (state.config as any).preferredAudioLanguage ??
    (state.config as any).preferredAudioLanguages?.[0] ??
    state.config?.preferredAudioLanguages;
  return {
    config: {
      ...state.config,
      preferredAudioLanguage:
        typeof preferredAudioLanguage === "string"
          ? preferredAudioLanguage
          : null,
    },
    playlistPreferences: state.playlistPreferences,
  };
}
