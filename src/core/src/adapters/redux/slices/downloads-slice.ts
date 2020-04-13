import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ActionType } from "typesafe-actions";
import { Fragment, Playlist, PlaylistStatus } from "../../../entities";

export interface IDownloadsState {
  playlists: Record<string, Playlist>;
  playlistsStatus: Record<string, PlaylistStatus>;
}
const initialDownloadsState: IDownloadsState = {
  playlistsStatus: {},
  playlists: {},
};

export interface IFetchPlaylistFragmentsDetailsPayload {
  playlistID: string;
  fragments: Fragment[];
}
export interface IDownloadPlaylistPayload {
  playlist: Playlist;
}
export interface IFinishPlaylistDownloadPayload {
  playlistID: string;
}
export interface IIncPlaylistDownloadStatusPayload {
  playlistID: string;
}
export interface ISavePlaylistToFilePayload {
  playlistID: string;
}
export interface ISavePlaylistToFileSuccessPayload {
  playlistID: string;
}

export const downloadsSlice = createSlice({
  name: "downloads",
  initialState: initialDownloadsState,
  reducers: {
    downloadPlaylist(state, action: PayloadAction<IDownloadPlaylistPayload>) {
      const { playlist } = action.payload;

      state.playlists[playlist.id] = playlist;
    },
    fetchPlaylistFragmentsDetails(
      state,
      action: PayloadAction<IFetchPlaylistFragmentsDetailsPayload>
    ) {
      const { playlistID, fragments } = action.payload;

      state.playlistsStatus[playlistID] = {
        done: 0,
        total: fragments.length,
        status: "init",
      };
    },
    finishPlaylistDownload(
      state,
      action: PayloadAction<IFinishPlaylistDownloadPayload>
    ) {
      const { playlistID } = action.payload;
      const playlistStatus = state.playlistsStatus[playlistID];

      playlistStatus.done = playlistStatus.total;
      playlistStatus.status = "ready";
    },
    incPlaylistDownloadStatus(
      state,
      action: PayloadAction<IIncPlaylistDownloadStatusPayload>
    ) {
      const { playlistID } = action.payload;
      const playlistStatus = state.playlistsStatus[playlistID];

      playlistStatus.status = "downloading";
      playlistStatus.done++;
    },
    savePlaylistToFile(
      state,
      action: PayloadAction<ISavePlaylistToFilePayload>
    ) {
      const { playlistID } = action.payload;
      const playlistStatus = state.playlistsStatus[playlistID];

      playlistStatus.status = "saving";
    },
    savePlaylistToFileSuccess(
      state,
      action: PayloadAction<ISavePlaylistToFileSuccessPayload>
    ) {
      const { playlistID } = action.payload;
      const playlistStatus = state.playlistsStatus[playlistID];

      playlistStatus.status = "done";
    },
  },
});

export type DownloadAction = ActionType<typeof downloadsSlice.actions>;
export const downloadsActions = downloadsSlice.actions;
