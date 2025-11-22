import {
  CaseReducer,
  createSlice,
  PayloadAction,
  Slice,
} from "@reduxjs/toolkit";

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
      action: PayloadAction<ISetSubtitleSelectionPayload>,
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
      action: PayloadAction<IRemovePlaylistPreferencesPayload>,
    ) {
      const { playlistID } = action.payload;
      delete state.audioSelections[playlistID];
      delete state.subtitleSelections[playlistID];
    },
  },
});
