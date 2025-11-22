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
  const state = res.state as Partial<RootState> | undefined;
  if (!state || !state.config) {
    return;
  }
  const preferredAudioLanguage =
    (state.config as any).preferredAudioLanguage ??
    (state.config as any).preferredAudioLanguages?.[0] ??
    (state.config as any).preferredAudioLanguages;
  const config =
    preferredAudioLanguage === undefined
      ? { ...state.config }
      : {
          ...state.config,
          preferredAudioLanguage:
            typeof preferredAudioLanguage === "string"
              ? preferredAudioLanguage
              : null,
        };
  const persistedState: Partial<RootState> = {
    config,
  };

  if (state.playlistPreferences) {
    persistedState.playlistPreferences = state.playlistPreferences;
  }

  return persistedState;
}
