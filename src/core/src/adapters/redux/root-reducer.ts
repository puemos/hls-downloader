import { combineReducers } from "@reduxjs/toolkit";
import { ActionType } from "typesafe-actions";

import { levelsSlice, playlistsSlice } from "./slices";

export const rootReducer = combineReducers({
  playlists: playlistsSlice.reducer,
  levels: levelsSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type RootAction =
  | ActionType<typeof levelsSlice.actions>
  | ActionType<typeof playlistsSlice.actions>;
