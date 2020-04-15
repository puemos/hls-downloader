import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Fragment, Level, LevelStatus } from "../../../entities";

export interface ILevelsState {
  levels: Record<string, Level>;
  levelsStatus: Record<string, LevelStatus>;
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
  level: Level;
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
    downloadLevel(state, action: PayloadAction<IDownloadLevelPayload>) {
      const { level: level } = action.payload;

      state.levels[level.id] = level;
    },
    fetchLevelFragmentsDetails(
      state,
      action: PayloadAction<IFetchLevelFragmentsDetailsPayload>
    ) {
      const { levelID: levelID, fragments } = action.payload;

      state.levelsStatus[levelID] = {
        done: 0,
        total: fragments.length,
        status: "init",
      };
    },
    finishLevelDownload(
      state,
      action: PayloadAction<IFinishLevelDownloadPayload>
    ) {
      const { levelID: levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID];

      levelStatus.done = levelStatus.total;
      levelStatus.status = "ready";
    },
    incLevelDownloadStatus(
      state,
      action: PayloadAction<IIncLevelDownloadStatusPayload>
    ) {
      const { levelID: levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID];

      levelStatus.status = "downloading";
      levelStatus.done++;
    },
    saveLevelToFile(state, action: PayloadAction<ISaveLevelToFilePayload>) {
      const { levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID];

      levelStatus.status = "saving";
    },
    saveLevelToFileSuccess(
      state,
      action: PayloadAction<ISaveLevelToFileSuccessPayload>
    ) {
      const { levelID: levelID } = action.payload;
      const levelStatus = state.levelsStatus[levelID];

      levelStatus.status = "done";
    },
  },
});
