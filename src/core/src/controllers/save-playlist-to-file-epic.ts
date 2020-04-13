import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState } from "../adapters/redux/root-reducer";
import {
  DownloadAction,
  downloadsActions,
} from "../adapters/redux/slices/downloads-slice";
import { Dependencies } from "../services";
import { mergeBucketFactory, writeToFileFactory } from "../use-cases";

export const savePlaylistToFileEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, _store$, { fs }) => {
  return action$.pipe(
    filter(downloadsActions.savePlaylistToFile.match),
    map((action) => action.payload.playlistID),
    mergeMap(
      (playlistID) => from(mergeBucketFactory(fs)(playlistID)),
      (playlistID, data) => ({ playlistID, data })
    ),
    mergeMap(
      ({ playlistID, data }) =>
        from(writeToFileFactory(fs)(`${playlistID}.mp4`, data)),
      ({ playlistID }) => ({ playlistID })
    ),
    mergeMap(({ playlistID }) =>
      of(downloadsActions.savePlaylistToFileSuccess({ playlistID }))
    )
  );
};
