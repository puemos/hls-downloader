import { createSlice } from "@reduxjs/toolkit";
import { Level, LevelStatus } from "../../../entities";

export interface IPlaylistsState {
  playlists: Record<string, Level>;
  playlistsStatus: Record<string, LevelStatus>;
}
const initialPlaylistsState: IPlaylistsState = {
  playlistsStatus: {},
  playlists: {},
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState: initialPlaylistsState,
  reducers: {
    blebleblb() {},
  },
});
