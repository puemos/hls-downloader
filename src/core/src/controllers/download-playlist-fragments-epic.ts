import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import {
  createBucketFactory,
  downloadSingleFragmentFactory,
  writeToBucketFactory,
  decryptSingleFragmentFactory,
} from "../use-cases";

export const downloadPlaylistFragmentsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store, { fs, loader, decryptor }) =>
  action$.pipe(
    filter(levelsSlice.actions.fetchLevelFragmentsDetails.match),
    map((action) => action.payload),
    mergeMap(
      ({ fragments, levelID }) =>
        from(createBucketFactory(fs)(levelID, fragments.length)),
      ({ fragments, levelID }) => ({
        fragments,
        levelID,
      })
    ),
    mergeMap(({ fragments, levelID }) =>
      from(fragments).pipe(
        mergeMap(
          (fragment) => from(downloadSingleFragmentFactory(loader)(fragment)),
          (fragment, data) => ({
            fragment,
            data,
            levelID,
          }),
          store.value.config.concurrency
        )
      )
    ),
    mergeMap(
      ({ data, fragment }) =>
        decryptSingleFragmentFactory(loader, decryptor)(fragment.key, data),
      ({ levelID, fragment }, data) => ({
        levelID,
        data,
        fragment,
      })
    ),
    mergeMap(
      ({ data, levelID, fragment }) =>
        writeToBucketFactory(fs)(levelID, fragment.index, data),
      ({ levelID }) => ({
        levelID,
      })
    ),
    mergeMap(({ levelID }) =>
      of(
        levelsSlice.actions.incLevelDownloadStatus({
          levelID,
        })
      )
    )
  );
