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
    filter(isActionOf(downloadsSlice.actions.finishDownload)),
    map((action) => action.payload.playlistID),

  );
};
