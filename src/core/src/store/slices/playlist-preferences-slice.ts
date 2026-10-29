import {
  CaseReducer,
  createSlice,
  PayloadAction,
  Slice,
} from "@reduxjs/toolkit";
import type { Level } from "../../entities";
import { levelsSlice } from "./levels-slice";

export interface ISetAudioSelectionPayload {
  playlistID: string;
  levelID: string;
}

export interface ISetSubtitleSelectionPayload {
  playlistID: string;
  levelID: string;
}

export interface IRemovePlaylistPreferencesPayload {
  playlistID: string;
}

export interface IPlaylistPreferencesState {
  audioSelections: Record<string, string | undefined>;
  subtitleSelections: Record<string, string | undefined>;
}

interface IPlaylistPreferencesReducers {
  setAudioSelection: CaseReducer<
    IPlaylistPreferencesState,
    PayloadAction<ISetAudioSelectionPayload>
  >;
  setSubtitleSelection: CaseReducer<
    IPlaylistPreferencesState,
    PayloadAction<ISetSubtitleSelectionPayload>
  >;
  clear: CaseReducer<IPlaylistPreferencesState, PayloadAction<undefined>>;
  removePlaylistPreferences: CaseReducer<
    IPlaylistPreferencesState,
    PayloadAction<IRemovePlaylistPreferencesPayload>
  >;
  [key: string]: CaseReducer<IPlaylistPreferencesState, PayloadAction<any>>;
}

const initialState: IPlaylistPreferencesState = {
  audioSelections: {},
  subtitleSelections: {},
};

export const playlistPreferencesSlice: Slice<
  IPlaylistPreferencesState,
  IPlaylistPreferencesReducers,
  "playlistPreferences"
> = createSlice({
  name: "playlistPreferences",
  initialState,
  reducers: {
    setAudioSelection(state, action: PayloadAction<ISetAudioSelectionPayload>) {
      const { playlistID, levelID } = action.payload;
      state.audioSelections[playlistID] = levelID;
    },
    setSubtitleSelection(
      state,
      action: PayloadAction<ISetSubtitleSelectionPayload>
    ) {
      const { playlistID, levelID } = action.payload;
      state.subtitleSelections[playlistID] = levelID;
    },
    clear(state) {
      state.audioSelections = initialState.audioSelections;
      state.subtitleSelections = initialState.subtitleSelections;
    },
    removePlaylistPreferences(
      state,
      action: PayloadAction<IRemovePlaylistPreferencesPayload>
    ) {
      const { playlistID } = action.payload;
      delete state.audioSelections[playlistID];
      delete state.subtitleSelections[playlistID];
    },
  },
  extraReducers(builder) {
    builder.addCase(levelsSlice.actions.add, (state, action) => {
      // Upgrade saved choices once their playlist's new track IDs are available.
      for (const type of ["audio", "subtitle"] as const) {
        const selections =
          type === "audio" ? state.audioSelections : state.subtitleSelections;
        const matches = new Map<string, Level | null>();
        for (const level of action.payload.levels) {
          if (
            level.type !== type ||
            level.name === undefined ||
            level.groupId === undefined
          ) {
            continue;
          }
          const suffix = type === "subtitle" && level.instreamId ? "-cc" : "";
          const legacyId = `${level.name}-${level.groupId}${suffix}`;
          if (selections[level.playlistID] === legacyId) {
            matches.set(
              level.playlistID,
              matches.has(level.playlistID) ? null : level,
            );
          }
        }
        for (const [playlistId, level] of matches) {
          if (level) {
            selections[playlistId] = level.id;
          }
        }
      }
    });
  },
});
