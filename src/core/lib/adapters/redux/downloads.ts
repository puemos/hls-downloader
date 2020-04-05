import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Playlist } from "../../entities/playlist";

type PlaylistStatus = {
  total: number;
  done: number;
};
interface IDownloadPlaylistPayload {
  playlist: Playlist;
}
interface IUpdateDownloadStatusPayload {
  playlistID: string;
  status: PlaylistStatus;
}

const downloadsSlice = createSlice({
  name: "downloads",
  initialState: {
    playlistsStatus: {},
    playlists: {},
  },
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
      state.playlists[playlistID] = status;
    },
  },
});

export const { addDownload, updateDownloadStatus } = downloadsSlice.actions;

export default downloadsSlice.reducer;
