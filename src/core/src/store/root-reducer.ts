import { combineReducers } from "@reduxjs/toolkit";
import { ActionType, EmptyAction } from "typesafe-actions";

import {
  levelsSlice,
  playlistsSlice,
  configSlice,
  tabsSlice,
  jobsSlice,
} from "./slices";
import { subtitlesSlice } from "./slices/subtitles-slice";

export const rootReducer = combineReducers({
  playlists: playlistsSlice.reducer,
  levels: levelsSlice.reducer,
  config: configSlice.reducer,
  tabs: tabsSlice.reducer,
  jobs: jobsSlice.reducer,
  subtitles: subtitlesSlice.reducer,
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
  | ActionType<typeof subtitlesSlice.actions>;
