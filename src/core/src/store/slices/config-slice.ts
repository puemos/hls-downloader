import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";

export interface ISetConcurrencyPayload {
  concurrency: number;
}
export interface ISetSaveDialogPayload {
  saveDialog: boolean;
}

export interface ISetFetchAttemptsPayload {
  fetchAttempts: number;
}

export interface IConfigState {
  concurrency: number;
  saveDialog: boolean;
  fetchAttempts: number;
}

interface IConfigReducers {
  setConcurrency: CaseReducer<
    IConfigState,
    PayloadAction<ISetConcurrencyPayload>
  >;
  setSaveDialog: CaseReducer<
    IConfigState,
    PayloadAction<ISetSaveDialogPayload>
  >;
  setFetchAttempts: CaseReducer<
    IConfigState,
    PayloadAction<ISetFetchAttemptsPayload>
  >;
  [key: string]: CaseReducer<IConfigState, PayloadAction<any>>;
}

const initialConfigState: IConfigState = {
  concurrency: 2,
  saveDialog: false,
  fetchAttempts: 100,
};

export const configSlice: Slice<IConfigState, IConfigReducers, "config"> =
  createSlice({
    name: "config",
    initialState: initialConfigState,
    reducers: {
      setConcurrency(state, action: PayloadAction<ISetConcurrencyPayload>) {
        state.concurrency = action.payload.concurrency;
      },
      setSaveDialog(state, action: PayloadAction<ISetSaveDialogPayload>) {
        state.saveDialog = action.payload.saveDialog;
      },
      setFetchAttempts(state, action: PayloadAction<ISetFetchAttemptsPayload>) {
        state.fetchAttempts = action.payload.fetchAttempts;
      },
    },
  });
