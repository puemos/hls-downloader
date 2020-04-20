import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tab } from "../../../entities/tab";

export interface ISetTabPayload {
  tab: Tab;
}

export interface ITabsState {
  current: Tab;
}
const initialConfigState: ITabsState = {
  current: {
    id: -1,
  },
};

export const tabsSlice = createSlice({
  name: "tabs",
  initialState: initialConfigState,
  reducers: {
    setTab(state, action: PayloadAction<ISetTabPayload>) {
      state.current = action.payload.tab;
    },
  },
});
