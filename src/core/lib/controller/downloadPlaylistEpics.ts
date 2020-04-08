import { Epic, combineEpics } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap, concatAll, concatMap } from "rxjs/operators";
import {
  DownloadAction,
  downloadsSlice,
} from "../adapters/redux/downloads/downloadsSlice";
import { RootState } from "../adapters/redux/rootReducer";
import { Dependencies } from "../services/Dependencies";
import { downloadSingleFragmentFactory } from "../useCases/downloadSingleFragment";
import { getFragmentsDetailsFactory } from "../useCases/getFragmentsDetails";
import { writeToFileFactory } from "../useCases/writeToFile";
import { appendToFileFactory } from "../useCases/appendToFile";

export const fetchPlaylistFragmentsDetailsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, _store, { loader, parser, fs }) => {
  return action$.pipe(
    filter(downloadsSlice.actions.downloadPlaylist.match),
    map((action) => action.payload.playlist),
    mergeMap(
      (playlist) =>
        from(
          writeToFileFactory(fs)(`${playlist.id}.mp4`, new ArrayBuffer(0))
        ).pipe(),
      (playlist) => playlist
    ),
    mergeMap(
      (playlist) =>
        from(getFragmentsDetailsFactory(loader, parser)(playlist)).pipe(),
      (playlist, fragments) => ({
        fragments,
        playlist,
      })
    ),
    mergeMap(({ fragments, playlist }) =>
      of(
        downloadsSlice.actions.fetchPlaylistFragmentsDetails({
          fragments: fragments,
          playlistID: playlist.id,
        })
      )
    )
  );
};

export const downloadPlaylistFragmentsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, _store, { fs, loader }) => {
  return action$.pipe(
    filter(downloadsSlice.actions.fetchPlaylistFragmentsDetails.match),
    map((action) => action.payload),
    concatMap(({ fragments, playlistID }) =>
      from(fragments).pipe(
        concatMap(
          (fragment) => from(downloadSingleFragmentFactory(loader)(fragment)),
          (fragment, data) => ({
            fragment,
            data,
            playlistID,
          })
        )
      )
    ),
    concatMap(
      ({ data, playlistID, fragment }) =>
        appendToFileFactory(fs)(`${playlistID}.mp4`, data),
      ({ playlistID }) => ({
        playlistID,
      })
    ),
    mergeMap(({ playlistID }) =>
      of(
        downloadsSlice.actions.incDownloadStatus({
          playlistID,
        })
      )
    )
  );
};

export const finishPlaylistFragmentsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, store$) => {
  return action$.pipe(
    filter(downloadsSlice.actions.incDownloadStatus.match),
    map((action) => action.payload.playlistID),
    map((id) => ({ id, status: store$.value.downloads.playlistsStatus[id] })),
    filter(({ status }) => status.done === status.total),
    mergeMap(({ id }) =>
      of(
        downloadsSlice.actions.finishDownload({
          playlistID: id,
        })
      )
    )
  );
};

export const downloadPlaylistEpics = combineEpics(
  fetchPlaylistFragmentsDetailsEpic,
  downloadPlaylistFragmentsEpic,
  finishPlaylistFragmentsEpic
);
