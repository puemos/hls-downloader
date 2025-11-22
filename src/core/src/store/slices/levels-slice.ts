import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";
import { Level } from "../../entities";

export interface ILevelsState {
  levels: Record<string, Level | null>;
}
export interface IRemovePlaylistLevelsPayload {
  playlistID: string;
}
export interface IAddLevelsPayload {
  levels: Level[];
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
  [key: string]: CaseReducer<ILevelsState, PayloadAction<any>>;
}

const initialLevelsState: ILevelsState = {
  levels: {},
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
      },
      removePlaylistLevels(
        state,
        action: PayloadAction<IRemovePlaylistLevelsPayload>,
      ) {
        const { playlistID } = action.payload;
        for (const id in state.levels) {
          if (state.levels.hasOwnProperty(id)) {
            const level = state.levels[id];
            if (level?.playlistID === playlistID) {
              delete state.levels[id];
            }
          }
        }
      },
    },
  });
