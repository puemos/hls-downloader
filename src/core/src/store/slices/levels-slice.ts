import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";
import { Level } from "../../entities";

export interface ILevelsState {
  levels: Record<string, Level | null>;
  durations: Record<string, number | null | undefined>;
}
export interface IRemovePlaylistLevelsPayload {
  playlistID: string;
}
export interface IAddLevelsPayload {
  levels: Level[];
}
export interface ISetLevelDurationPayload {
  levelId: string;
  durationSec: number | null;
}
export interface IDownloadLevelPayload {
  levelID: string;
  audioLevelID?: string;
  subtitleLevelID?: string;
}

interface ILevelsReducers {
  download: CaseReducer<ILevelsState, PayloadAction<IDownloadLevelPayload>>;
  add: CaseReducer<ILevelsState, PayloadAction<IAddLevelsPayload>>;
  clear: CaseReducer<ILevelsState, PayloadAction<any>>;
  removePlaylistLevels: CaseReducer<
    ILevelsState,
    PayloadAction<IRemovePlaylistLevelsPayload>
  >;
  setDuration: CaseReducer<ILevelsState, PayloadAction<ISetLevelDurationPayload>>;
  [key: string]: CaseReducer<ILevelsState, PayloadAction<any>>;
}

const initialLevelsState: ILevelsState = {
  levels: {},
  durations: {},
};
export const levelsSlice: Slice<ILevelsState, ILevelsReducers, "levels"> =
  createSlice({
    name: "levels",
    initialState: initialLevelsState,
    reducers: {
      download(_state, _action: PayloadAction<IDownloadLevelPayload>) {},
      add(state, action: PayloadAction<IAddLevelsPayload>) {
        const { levels } = action.payload;
        levels.forEach((level) => {
          state.levels[level.id] = level;
        });
      },
      clear(state) {
        state.levels = initialLevelsState.levels;
        state.durations = initialLevelsState.durations;
      },
      removePlaylistLevels(
        state,
        action: PayloadAction<IRemovePlaylistLevelsPayload>
      ) {
        const { playlistID } = action.payload;
        for (const id in state.levels) {
          if (state.levels.hasOwnProperty(id)) {
            const level = state.levels[id];
            if (level?.playlistID === playlistID) {
              delete state.levels[id];
              delete state.durations[id];
            }
          }
        }
      },
      setDuration(state, action: PayloadAction<ISetLevelDurationPayload>) {
        state.durations[action.payload.levelId] = action.payload.durationSec;
      },
    },
  });
