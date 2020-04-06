import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ActionType } from "typesafe-actions";
import { Playlist } from "../../../entities/playlist";

export interface IDownloadsState {
  playlists: Record<string, Playlist>;
  playlistsStatus: Record<string, PlaylistStatus>;
}

export type PlaylistStatus = {
  status: "downloading" | "done";
  total: number;
  done: number;
};
export interface IDownloadPlaylistPayload {
  playlist: Playlist;
}
export interface IFinishDownloadPayload {
  playlistID: string;
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
    downloadPlaylist(state, action: PayloadAction<IDownloadPlaylistPayload>) {
      const { playlist } = action.payload;

      state.playlists[playlist.uri] = playlist;
    },
    finishDownload(state, action: PayloadAction<IFinishDownloadPayload>) {
      const { playlistID } = action.payload;
      const playlistStatus = state.playlistsStatus[playlistID];

      playlistStatus.done = playlistStatus.total;
      playlistStatus.status = "done";
    },
    incDownloadStatus(state, action: PayloadAction<IIncStatusPayload>) {
      const { playlistID } = action.payload;
      const playlistStatus = state.playlistsStatus[playlistID];

      playlistStatus.status = "downloading";
      playlistStatus.done++;
    },
  },
});

export type DownloadAction = ActionType<typeof downloadsSlice.actions>;
