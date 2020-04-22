import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ISetConcurrencyPayload {
  concurrency: number;
}
export interface ISetSaveDialogPayload {
  saveDialog: boolean;
}

export interface IConfigState {
  concurrency: number;
  saveDialog: boolean;
}
const initialConfigState: IConfigState = {
  concurrency: 2,
  saveDialog: false,
};

export const configSlice = createSlice({
  name: "config",
  initialState: initialConfigState,
  reducers: {
    setConcurrency(state, action: PayloadAction<ISetConcurrencyPayload>) {
      state.concurrency = action.payload.concurrency;
    },
    setSaveDialog(state, action: PayloadAction<ISetSaveDialogPayload>) {
      state.saveDialog = action.payload.saveDialog;
    },
  },
});
