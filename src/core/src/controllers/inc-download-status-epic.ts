import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState } from "../adapters/redux/root-reducer";
import {
  DownloadAction,
  downloadsActions,
} from "../adapters/redux/slices/downloads-slice";
import { Dependencies } from "../services";

export const incDownloadStatusEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, store$) => {
  return action$.pipe(
    filter(downloadsActions.incPlaylistDownloadStatus.match),
    map((action) => action.payload.playlistID),
    map((id) => ({ id, status: store$.value.downloads.playlistsStatus[id] })),
    filter(({ status }) => status.done === status.total),
    mergeMap(({ id }) =>
      of(
        downloadsActions.finishPlaylistDownload({
          playlistID: id,
        })
      )
    )
  );
};
