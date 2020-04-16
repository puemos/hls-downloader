import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Level } from "../../../entities";
import { Playlist } from "../../../entities/playlist";
import { PlaylistStatus } from "../../../entities/playlist-status";

export interface IFetchPlaylistLevelsPayload {
  playlistID: string;
  uri: string;
}

export interface IFetchPlaylistLevelsSuccessPayload {
  playlistID: string;
  levels: Level[]
}

export interface IPlaylistsState {
  playlistsStatus: Record<string, PlaylistStatus | null>;
  playlists: Record<string, Playlist | null>;
}
const initialPlaylistsState: IPlaylistsState = {
  playlistsStatus: {},
  playlists: {},
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState: initialPlaylistsState,
  reducers: {
    fetchPlaylistLevels(
      state,
      action: PayloadAction<IFetchPlaylistLevelsPayload>
    ) {
      const { playlistID, uri } = action.payload;
      state.playlistsStatus[playlistID] = {
        status: "fetching",
      };
      state.playlists[playlistID] = {
        id: playlistID,
        uri,
      };
    },
    fetchPlaylistLevelsSuccess(
      state,
      action: PayloadAction<IFetchPlaylistLevelsSuccessPayload>
    ) {
      const { playlistID } = action.payload;
      state.playlistsStatus[playlistID]!.status = "ready";
    },
  },
});
