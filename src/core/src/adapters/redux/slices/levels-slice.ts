import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Fragment, Level, LevelStatus } from "../../../entities";

export interface ILevelsState {
  levels: Record<string, Level | null>;
  levelsStatus: Record<string, LevelStatus | null>;
}
const initialLevelsState: ILevelsState = {
  levelsStatus: {},
  levels: {},
};

export interface IFetchLevelFragmentsDetailsPayload {
  levelID: string;
  fragments: Fragment[];
}
export interface IDownloadLevelPayload {
  levelID: string;
}
export interface IAddLevelsPayload {
  levels: Level[];
}
export interface IFinishLevelDownloadPayload {
  levelID: string;
}
export interface IIncLevelDownloadStatusPayload {
  levelID: string;
}
export interface ISaveLevelToFilePayload {
  levelID: string;
}
export interface ISaveLevelToFileSuccessPayload {
  levelID: string;
}

export const levelsSlice = createSlice({
  name: "levels",
  initialState: initialLevelsState,
  reducers: {
    addLevels(state, action: PayloadAction<IAddLevelsPayload>) {
      const { levels } = action.payload;
      levels.forEach((level) => {
        state.levels[level.id] = level;
        state.levelsStatus[level.id] = {
          done: 0,
          total: 0,
          status: "init",
        };
      });
    },
    downloadLevel(_state, _action: PayloadAction<IDownloadLevelPayload>) {},
    fetchLevelFragmentsDetails(
      state,
      action: PayloadAction<IFetchLevelFragmentsDetailsPayload>
    ) {
      const { levelID, fragments } = action.payload;

      state.levelsStatus[levelID] = {
        done: 0,
        total: fragments.length,
        status: "downloading",
      };
    },
    finishLevelDownload(
      state,
      action: PayloadAction<IFinishLevelDownloadPayload>
    ) {
      const { levelID: levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID]!;

      levelStatus.done = levelStatus.total;
      levelStatus.status = "ready";
    },
    incLevelDownloadStatus(
      state,
      action: PayloadAction<IIncLevelDownloadStatusPayload>
    ) {
      const { levelID: levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID]!;

      levelStatus.done++;
    },
    saveLevelToFile(state, action: PayloadAction<ISaveLevelToFilePayload>) {
      const { levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID]!;

      levelStatus.status = "saving";
    },
    saveLevelToFileSuccess(
      state,
      action: PayloadAction<ISaveLevelToFileSuccessPayload>
    ) {
      const { levelID: levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID]!;

      levelStatus.status = "done";
    },
  },
});
