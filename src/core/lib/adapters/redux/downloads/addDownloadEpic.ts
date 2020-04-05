import { Epic } from "redux-observable";
import { from } from "rxjs";
import { switchMap, filter, mapTo } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicDependencies } from "../epicDependencies";
import { savePlaylistFactory } from "../../../controller/savePlaylist";
import { DownloadAction, downloadsSlice } from "./downloadsSlice";
import { RootState } from "../rootReducer";

export const addDownloadEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  EpicDependencies
> = (action$, store, { config, decryptor, fs, loader, parser }) => {
  const savePlaylist = savePlaylistFactory(
    config,
    loader,
    decryptor,
    parser,
    fs
  );
  return action$.pipe(
    filter(isActionOf(downloadsSlice.actions.addDownload)),
    switchMap((action) =>
      from(
        savePlaylist(
          action.payload.playlist,
          action.payload.playlist.uri,
          (total) =>
            mapTo(
              downloadsSlice.actions.updateDownloadStatus({
                playlistID: action.payload.playlist.uri,
                status: {
                  done: 0,
                  total,
                },
              })
            ),
          () =>
            mapTo(
              downloadsSlice.actions.incDownloadStatus({
                playlistID: action.payload.playlist.uri,
              })
            ),
          () => {}
        )
      ).pipe(
        mapTo(
          downloadsSlice.actions.incDownloadStatus({
            playlistID: action.payload.playlist.uri,
          })
        )
      )
    )
  );
};
