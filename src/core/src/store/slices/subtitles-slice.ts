import {
  CaseReducer,
  PayloadAction,
  Slice,
  createSlice,
} from "@reduxjs/toolkit";

export type SubtitleDownloadStatus = "init" | "downloading" | "done" | "error";

export interface ISubtitlesState {
  subtitles: Record<
    string,
    {
      status: SubtitleDownloadStatus;
      message?: string;
      filename?: string;
    } | null
  >;
}

export interface IDownloadSubtitlePayload {
  levelID: string;
  playlistID: string;
}

export interface IDownloadSubtitleSuccessPayload {
  levelID: string;
  filename: string;
}

export interface IDownloadSubtitleFailedPayload {
  levelID: string;
  message: string;
}

interface ISubtitlesReducers {
  download: CaseReducer<
    ISubtitlesState,
    PayloadAction<IDownloadSubtitlePayload>
  >;
  downloadSuccess: CaseReducer<
    ISubtitlesState,
    PayloadAction<IDownloadSubtitleSuccessPayload>
  >;
  downloadFailed: CaseReducer<
    ISubtitlesState,
    PayloadAction<IDownloadSubtitleFailedPayload>
  >;
  clear: CaseReducer<ISubtitlesState>;
  [key: string]: CaseReducer<ISubtitlesState, PayloadAction<any>>;
}

const initialSubtitlesState: ISubtitlesState = {
  subtitles: {},
};

export const subtitlesSlice: Slice<
  ISubtitlesState,
  ISubtitlesReducers,
  "subtitles"
> = createSlice({
  name: "subtitles",
  initialState: initialSubtitlesState,
  reducers: {
    download(state, action: PayloadAction<IDownloadSubtitlePayload>) {
      const { levelID } = action.payload;
      state.subtitles[levelID] = { status: "downloading" };
    },
    downloadSuccess(
      state,
      action: PayloadAction<IDownloadSubtitleSuccessPayload>,
    ) {
      const { levelID, filename } = action.payload;
      state.subtitles[levelID] = { status: "done", filename };
    },
    downloadFailed(
      state,
      action: PayloadAction<IDownloadSubtitleFailedPayload>,
    ) {
      const { levelID, message } = action.payload;
      state.subtitles[levelID] = { status: "error", message };
    },
    clear(state) {
      state.subtitles = initialSubtitlesState.subtitles;
    },
  },
});
