import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Playlist } from "../../../entities/playlist";
import { PlaylistStatus } from "../../../entities/playlist-status";

export type IFetchPlaylistLevelsSuccessPayload = {
  playlistID: string;
};
export type IFetchPlaylistLevelsFailedPayload = {
  playlistID: string;
};
export type IFetchPlaylistLevelsPayload = {
  playlistID: string;
};
export type IAddPlaylistPayload = Playlist;
export type IPlaylistsState = {
  playlistsStatus: Record<string, PlaylistStatus | null>;
  playlists: Record<string, Playlist | null>;
};

const initialPlaylistsState: IPlaylistsState = {
  playlistsStatus: {},
  playlists: {},
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState: initialPlaylistsState,
  reducers: {
    clearPlaylists(state) {
      state.playlists = initialPlaylistsState.playlists
      state.playlistsStatus = initialPlaylistsState.playlistsStatus
    },
    addPlaylist(state, action: PayloadAction<IAddPlaylistPayload>) {
      const playlist = action.payload;
      state.playlistsStatus[playlist.id] = {
        status: "init",
      };
      state.playlists[playlist.id] = playlist;
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
