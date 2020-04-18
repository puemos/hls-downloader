import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ISetConcurrencyPayload {
  concurrency: number;
}
export interface ISetAutoSavePayload {
  autoSave: boolean;
}

export interface IConfigState {
  concurrency: number;
  autoSave: boolean;
}
const initialConfigState: IConfigState = {
  concurrency: 2,
  autoSave: false,
};

export const configSlice = createSlice({
  name: "config",
  initialState: initialConfigState,
  reducers: {
    setConcurrency(state, action: PayloadAction<ISetConcurrencyPayload>) {
      state.concurrency = action.payload.concurrency;
    },
    setAutosave(state, action: PayloadAction<ISetAutoSavePayload>) {
      state.autoSave = action.payload.autoSave;
    },
  },
});
