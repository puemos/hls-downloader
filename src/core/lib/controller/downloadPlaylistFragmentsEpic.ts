import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import {
  DownloadAction,
  downloadsSlice,
} from "../adapters/redux/downloads/downloadsSlice";
import { RootState } from "../adapters/redux/rootReducer";
import { Dependencies } from "../services/Dependencies";
import { downloadSingleFragmentFactory } from "../useCases/downloadSingleFragment";
import { getFragmentsDetailsFactory } from "../useCases/getFragmentsDetails";
import { writeToFSFactory } from "../useCases/writeToFS";

export const downloadPlaylistFragmentsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, _store, { fs, loader, parser }) => {
  return action$.pipe(
    filter(isActionOf(downloadsSlice.actions.downloadPlaylist)),
    map((action) => action.payload.playlist),
    mergeMap((playlist) =>
      from(getFragmentsDetailsFactory(loader, parser)(playlist)).pipe(
        map((fragments) => ({ fragments, playlist }))
      )
    ),
    mergeMap(({ fragments, playlist }) =>
      from(fragments).pipe(
        mergeMap((fragment) =>
          from(downloadSingleFragmentFactory(loader)(fragment)).pipe(
            map((data) => ({ fragment, data, playlist }))
          )
        )
      )
    ),
    mergeMap(({ fragment, data, playlist }) => {
      writeToFSFactory(fs)(playlist.uri + fragment.index, data);
      return of(
        downloadsSlice.actions.incDownloadStatus({
          playlistID: playlist.uri,
        })
      );
    })
  );
};
