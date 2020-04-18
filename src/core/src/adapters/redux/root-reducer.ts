import { combineReducers } from "@reduxjs/toolkit";
import { ActionType } from "typesafe-actions";

import { levelsSlice, playlistsSlice, configSlice } from "./slices";

export const rootReducer = combineReducers({
  playlists: playlistsSlice.reducer,
  levels: levelsSlice.reducer,
  config: configSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type RootAction =
  | ActionType<typeof configSlice.actions>
  | ActionType<typeof levelsSlice.actions>
  | ActionType<typeof playlistsSlice.actions>;
