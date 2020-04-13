import { combineReducers } from "@reduxjs/toolkit";
import { downloadsSlice } from "./slices";

export const rootReducer = combineReducers({
  downloads: downloadsSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
