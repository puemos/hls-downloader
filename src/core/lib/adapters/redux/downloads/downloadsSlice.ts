import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Playlist } from "../../../entities/playlist";
import { of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ActionType } from "typesafe-actions";

export interface IDownloadsState {
  playlists: Record<string, Playlist>;
  playlistsStatus: Record<string, PlaylistStatus>;
}

export type PlaylistStatus = {
  total: number;
  done: number;
};
export interface IDownloadPlaylistPayload {
  playlist: Playlist;
}
export interface IUpdateDownloadStatusPayload {
  playlistID: string;
  status: PlaylistStatus;
}
export interface IIncStatusPayload {
  playlistID: string;
}

const initialDownloadsState: IDownloadsState = {
  playlistsStatus: {},
  playlists: {},
};

export const downloadsSlice = createSlice({
  name: "downloads",
  initialState: initialDownloadsState,
  reducers: {
    addDownload(state, action: PayloadAction<IDownloadPlaylistPayload>) {
      const { playlist } = action.payload;
      state.playlists[playlist.uri] = playlist;
    },
    updateDownloadStatus(
      state,
      action: PayloadAction<IUpdateDownloadStatusPayload>
    ) {
      const { playlistID, status } = action.payload;
      state.playlistsStatus[playlistID] = status;
    },
    incDownloadStatus(state, action: PayloadAction<IIncStatusPayload>) {
      const { playlistID } = action.payload;
      state.playlistsStatus[playlistID].done++;
    },
  },
});

export type DownloadAction = ActionType<typeof downloadsSlice.actions>;
