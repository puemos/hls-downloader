import {
  CaseReducer,
  createSlice,
  PayloadAction,
  Slice,
} from "@reduxjs/toolkit";
import { LevelInspection } from "../../entities";

export interface IInspectLevelPayload {
  levelId: string;
}

export interface IInspectLevelSuccessPayload {
  inspection: LevelInspection;
}

export interface IInspectLevelFailedPayload {
  levelId: string;
  message: string;
}

export interface IRemovePlaylistInspectionsPayload {
  playlistID: string;
}

export interface ILevelInspectionsState {
  inspections: Record<string, LevelInspection | null>;
  status: Record<string, "idle" | "pending" | "ready" | "error">;
  errors: Record<string, string | null>;
}

interface ILevelInspectionsReducers {
  inspect: CaseReducer<
    ILevelInspectionsState,
    PayloadAction<IInspectLevelPayload>
  >;
  inspectSuccess: CaseReducer<
    ILevelInspectionsState,
    PayloadAction<IInspectLevelSuccessPayload>
  >;
  inspectFailed: CaseReducer<
    ILevelInspectionsState,
    PayloadAction<IInspectLevelFailedPayload>
  >;
  clear: CaseReducer<ILevelInspectionsState, PayloadAction<undefined>>;
  removePlaylistInspections: CaseReducer<
    ILevelInspectionsState,
    PayloadAction<IRemovePlaylistInspectionsPayload>
  >;
  [key: string]: CaseReducer<ILevelInspectionsState, PayloadAction<any>>;
}

const initialState: ILevelInspectionsState = {
  inspections: {},
  status: {},
  errors: {},
};

export const levelInspectionsSlice: Slice<
  ILevelInspectionsState,
  ILevelInspectionsReducers,
  "levelInspections"
> = createSlice({
  name: "levelInspections",
  initialState,
  reducers: {
    inspect(state, action: PayloadAction<IInspectLevelPayload>) {
      const { levelId } = action.payload;
      state.status[levelId] = "pending";
      state.errors[levelId] = null;
    },
    inspectSuccess(state, action: PayloadAction<IInspectLevelSuccessPayload>) {
      const inspection = action.payload.inspection;
      state.inspections[inspection.levelId] = inspection;
      state.status[inspection.levelId] = "ready";
      state.errors[inspection.levelId] = null;
    },
    inspectFailed(state, action: PayloadAction<IInspectLevelFailedPayload>) {
      const { levelId, message } = action.payload;
      state.status[levelId] = "error";
      state.errors[levelId] = message;
    },
    clear(state) {
      state.inspections = initialState.inspections;
      state.status = initialState.status;
      state.errors = initialState.errors;
    },
    removePlaylistInspections(
      state,
      action: PayloadAction<IRemovePlaylistInspectionsPayload>
    ) {
      const { playlistID } = action.payload;
      for (const id in state.inspections) {
        if (state.inspections.hasOwnProperty(id)) {
          const inspection = state.inspections[id];
          if (inspection?.playlistId === playlistID) {
            delete state.inspections[id];
            delete state.status[id];
            delete state.errors[id];
          }
        }
      }
    },
  },
});
