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

export interface ISetProxyEnabledPayload {
  proxyEnabled: boolean;
}

export interface IConfigState {
  concurrency: number;
  saveDialog: boolean;
  fetchAttempts: number;
  proxyEnabled: boolean;
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
  setProxyEnabled: CaseReducer<
    IConfigState,
    PayloadAction<ISetProxyEnabledPayload>
  >;
  [key: string]: CaseReducer<IConfigState, PayloadAction<any>>;
}

const initialConfigState: IConfigState = {
  concurrency: 2,
  saveDialog: false,
  fetchAttempts: 100,
  proxyEnabled: false,
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
      setProxyEnabled(state, action: PayloadAction<ISetProxyEnabledPayload>) {
        state.proxyEnabled = action.payload.proxyEnabled;
      },
    },
  });
