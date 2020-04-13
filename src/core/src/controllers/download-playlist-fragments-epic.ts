import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState } from "../adapters/redux/root-reducer";
import {
  DownloadAction,
  downloadsActions,
} from "../adapters/redux/slices/downloads-slice";
import { Dependencies } from "../services";
import {
  createBucketFactory,
  downloadSingleFragmentFactory,
  writeToBucketFactory,
} from "../use-cases";

export const downloadPlaylistFragmentsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, _store, { fs, loader, config }) => {
  return action$.pipe(
    filter(downloadsActions.fetchPlaylistFragmentsDetails.match),
    map((action) => action.payload),
    mergeMap(
      ({ fragments, playlistID }) =>
        from(createBucketFactory(fs)(playlistID, fragments.length)),
      ({ fragments, playlistID }) => ({
        fragments,
        playlistID,
      })
    ),
    mergeMap(({ fragments, playlistID }) =>
      from(fragments).pipe(
        mergeMap(
          (fragment) => from(downloadSingleFragmentFactory(loader)(fragment)),
          (fragment, data) => ({
            fragment,
            data,
            playlistID,
          }),
          config.concurrency
        )
      )
    ),
    mergeMap(
      ({ data, playlistID, fragment }) =>
        writeToBucketFactory(fs)(playlistID, fragment.index, data),
      ({ playlistID }) => ({
        playlistID,
      })
    ),
    mergeMap(({ playlistID }) =>
      of(
        downloadsActions.incPlaylistDownloadStatus({
          playlistID,
        })
      )
    )
  );
};
