import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap, takeUntil } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
import { Dependencies } from "../services";
import {
  createBucketFactory,
  decryptSingleFragmentFactory,
  downloadSingleFactory,
  writeToBucketFactory,
} from "../use-cases";

export const downloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { fs, loader, decryptor }) =>
  action$.pipe(
    filter(jobsSlice.actions.add.match),
    map((action) => action.payload.job),
    mergeMap(({ videoFragments, audioFragments, id }) => {
      const fragments = videoFragments.concat(
        audioFragments.map((fragment) => ({
          ...fragment,
          index: fragment.index + videoFragments.length,
        })),
      );
      return from(
        createBucketFactory(fs)(
          id,
          videoFragments.length,
          audioFragments.length,
        ).then(() => ({
          fragments,
          id,
        })),
      );
    }),
    mergeMap(({ fragments, id }) =>
      from(fragments).pipe(
        mergeMap(
          (fragment) =>
            from(
              downloadSingleFactory(loader)(
                fragment,
                store$.value.config.fetchAttempts,
              ).then((data) => ({
                fragment,
                data,
                id,
              })),
            ),

          store$.value.config.concurrency,
        ),
        mergeMap(({ data, fragment, id }) =>
          decryptSingleFragmentFactory(loader, decryptor)(
            fragment.key,
            data,
            store$.value.config.fetchAttempts,
          ).then((data) => ({
            fragment,
            data,
            id,
          })),
        ),
        mergeMap(({ data, id, fragment }) =>
          writeToBucketFactory(fs)(id, fragment.index, data).then(() => ({
            id,
          })),
        ),
        mergeMap(({ id }) =>
          of(
            jobsSlice.actions.incDownloadStatus({
              jobId: id,
            }),
          ),
        ),
        takeUntil(
          action$
            .pipe(filter(jobsSlice.actions.cancel.match))
            .pipe(filter((action) => action.payload.jobId === id)),
        ),
        catchError((error: unknown) =>
          of(
            jobsSlice.actions.downloadFailed({
              jobId: id,
              message:
                (error as Error)?.message ||
                "Download failed during fragment processing",
            }),
          ),
        ),
      ),
    ),
  );
