import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Level } from "../../../entities";

export type ILevelsState = {
  levels: Record<string, Level | null>;
};
export type IRemovePlaylistLevelsPayload = {
  playlistID: string;
};
export type IAddLevelsPayload = {
  levels: Level[];
};
export type IDownloadLevelPayload = {
  levelID: string;
};
const initialLevelsState: ILevelsState = {
  levels: {},
};
export const levelsSlice = createSlice({
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
      action: PayloadAction<IRemovePlaylistLevelsPayload>
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
