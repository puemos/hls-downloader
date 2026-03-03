import { combineReducers } from "@reduxjs/toolkit";
import { ActionType, EmptyAction } from "typesafe-actions";

import {
  levelsSlice,
  playlistsSlice,
  configSlice,
  tabsSlice,
  jobsSlice,
} from "./slices";
import { levelInspectionsSlice } from "./slices/level-inspections-slice";
import { playlistPreferencesSlice } from "./slices/playlist-preferences-slice";
import { subtitlesSlice } from "./slices/subtitles-slice";
import { storageSlice } from "./slices/storage-slice";

export const rootReducer = combineReducers({
  playlists: playlistsSlice.reducer,
  levels: levelsSlice.reducer,
  config: configSlice.reducer,
  tabs: tabsSlice.reducer,
  jobs: jobsSlice.reducer,
  subtitles: subtitlesSlice.reducer,
  levelInspections: levelInspectionsSlice.reducer,
  playlistPreferences: playlistPreferencesSlice.reducer,
  storage: storageSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type RootAction =
  | EmptyAction<"init/start">
  | EmptyAction<"init/done">
  | ActionType<typeof jobsSlice.actions>
  | ActionType<typeof tabsSlice.actions>
  | ActionType<typeof configSlice.actions>
  | ActionType<typeof levelsSlice.actions>
  | ActionType<typeof playlistsSlice.actions>
  | ActionType<typeof subtitlesSlice.actions>
  | ActionType<typeof levelInspectionsSlice.actions>
  | ActionType<typeof playlistPreferencesSlice.actions>
  | ActionType<typeof storageSlice.actions>;
