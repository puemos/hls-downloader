import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";
import { Tab } from "../../entities/tab";

export interface ISetTabPayload {
  tab: Tab;
}

export interface ITabsState {
  current: Tab;
}

interface ITabsReducers {
  setTab: CaseReducer<ITabsState, PayloadAction<ISetTabPayload>>;
  [key: string]: CaseReducer<ITabsState, PayloadAction<any>>;
}

const initialConfigState: ITabsState = {
  current: {
    id: -1,
  },
};

export const tabsSlice: Slice<ITabsState, ITabsReducers, "tabs"> = createSlice({
  name: "tabs",
  initialState: initialConfigState,
  reducers: {
    setTab(state, action: PayloadAction<ISetTabPayload>) {
      state.current = action.payload.tab;
    },
  },
});
