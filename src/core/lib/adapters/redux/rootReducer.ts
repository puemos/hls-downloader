import { combineReducers } from "@reduxjs/toolkit";
import { downloadsSlice } from "./downloads/downloadsSlice";

export const rootReducer = combineReducers({
  downloads: downloadsSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
