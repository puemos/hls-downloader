import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import {
  filter,
  map,
  mergeMap,
  takeUntil,
  flatMap,
  take,
} from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import {
  createBucketFactory,
  downloadSingleFactory,
  writeToBucketFactory,
  decryptSingleFragmentFactory,
} from "../use-cases";
import { jobsSlice } from "../adapters/redux/slices";

export const downloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store, { fs, loader, decryptor }) =>
  action$.pipe(
    filter(jobsSlice.actions.add.match),
    map((action) => action.payload.job),
    mergeMap(({ fragments, id }) =>
      from(
        createBucketFactory(fs)(id, fragments.length).then(() => ({
          fragments,
          id,
        }))
      )
    ),
    mergeMap(({ fragments, id }) =>
      from(fragments).pipe(
        mergeMap(
          (fragment) =>
            from(
              downloadSingleFactory(loader)(fragment).then((data) => ({
                fragment,
                data,
                id,
              }))
            ),

          store.value.config.concurrency
        ),
        mergeMap(({ data, fragment, id }) =>
          decryptSingleFragmentFactory(loader, decryptor)(
            fragment.key,
            data
          ).then((data) => ({
            fragment,
            data,
            id,
          }))
        ),
        mergeMap(({ data, id, fragment }) =>
          writeToBucketFactory(fs)(id, fragment.index, data).then(() => ({
            id,
          }))
        ),
        mergeMap(({ id }) =>
          of(
            jobsSlice.actions.incDownloadStatus({
              jobId: id,
            })
          )
        ),
        takeUntil(
          action$
            .pipe(filter(jobsSlice.actions.cancel.match))
            .pipe(filter((action) => action.payload.jobId === id))
        )
      )
    )
  );
