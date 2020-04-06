import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import {
  DownloadAction,
  downloadsSlice,
} from "../adapters/redux/downloads/downloadsSlice";
import { RootState } from "../adapters/redux/rootReducer";
import { Dependencies } from "../services/Dependencies";

export const finishPlaylistFragmentsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, store$) => {
  return action$.pipe(
    filter(isActionOf(downloadsSlice.actions.incDownloadStatus)),
    map((action) => action.payload.playlistID),
    map((id) => ({ id, status: store$.value.downloads.playlistsStatus[id] })),
    filter(({ status }) => status.done === status.total - 1),
    mergeMap(({ id }) =>
      of(
        downloadsSlice.actions.finishDownload({
          playlistID: id,
        })
      )
    )
  );
};
