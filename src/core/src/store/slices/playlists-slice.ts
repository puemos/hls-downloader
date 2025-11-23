import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";
import { Playlist } from "../../entities/playlist";
import { PlaylistStatus } from "../../entities/playlist-status";

export interface IFetchPlaylistLevelsSuccessPayload {
  playlistID: string;
}
export interface IFetchPlaylistLevelsFailedPayload {
  playlistID: string;
}
export interface IFetchPlaylistLevelsPayload {
  playlistID: string;
}
export interface IAddPlaylistPayload extends Playlist {}
export interface IRemovePlaylistPayload {
  playlistID: string;
}
export interface IPlaylistsState {
  playlistsStatus: Record<string, PlaylistStatus | null>;
  playlists: Record<string, Playlist | null>;
}

interface IPlaylistsReducers {
  clearPlaylists: CaseReducer<IPlaylistsState, PayloadAction<undefined>>;
  addPlaylist: CaseReducer<IPlaylistsState, PayloadAction<IAddPlaylistPayload>>;
  removePlaylist: CaseReducer<
    IPlaylistsState,
    PayloadAction<IRemovePlaylistPayload>
  >;
  fetchPlaylistLevels: CaseReducer<
    IPlaylistsState,
    PayloadAction<IFetchPlaylistLevelsPayload>
  >;
  fetchPlaylistLevelsSuccess: CaseReducer<
    IPlaylistsState,
    PayloadAction<IFetchPlaylistLevelsSuccessPayload>
  >;
  fetchPlaylistLevelsFailed: CaseReducer<
    IPlaylistsState,
    PayloadAction<IFetchPlaylistLevelsFailedPayload>
  >;
  [key: string]: CaseReducer<IPlaylistsState, PayloadAction<any>>;
}

const initialPlaylistsState: IPlaylistsState = {
  playlistsStatus: {},
  playlists: {},
};

export const playlistsSlice: Slice<
  IPlaylistsState,
  IPlaylistsReducers,
  "playlists"
> = createSlice({
  name: "playlists",
  initialState: initialPlaylistsState,
  reducers: {
    clearPlaylists(state) {
      state.playlists = initialPlaylistsState.playlists;
      state.playlistsStatus = initialPlaylistsState.playlistsStatus;
    },
    addPlaylist(state, action: PayloadAction<IAddPlaylistPayload>) {
      const playlist = action.payload;
      state.playlistsStatus[playlist.id] = {
        status: "init",
      };
      state.playlists[playlist.id] = playlist;
    },
    removePlaylist(state, action: PayloadAction<IRemovePlaylistPayload>) {
      const playlistID = action.payload.playlistID;
      delete state.playlistsStatus[playlistID];
      delete state.playlists[playlistID];
    },
    fetchPlaylistLevels(
      state,
      action: PayloadAction<IFetchPlaylistLevelsPayload>
    ) {
      const { playlistID } = action.payload;
      state.playlistsStatus[playlistID]!.status = "fetching";
    },
    fetchPlaylistLevelsSuccess(
      state,
      action: PayloadAction<IFetchPlaylistLevelsSuccessPayload>
    ) {
      const { playlistID } = action.payload;
      state.playlistsStatus[playlistID]!.status = "ready";
    },
    fetchPlaylistLevelsFailed(
      state,
      action: PayloadAction<IFetchPlaylistLevelsFailedPayload>
    ) {
      const { playlistID } = action.payload;
      state.playlistsStatus[playlistID]!.status = "error";
    },
  },
});
