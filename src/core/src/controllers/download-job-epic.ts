import { Epic } from "redux-observable";
import { EMPTY, from, of } from "rxjs";
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
    filter(jobsSlice.actions.download.match),
    map((action) => action.payload.jobId),
    mergeMap((jobId) => {
      const job = store$.value.jobs.jobs[jobId];
      if (!job) {
        return EMPTY;
      }
      const { videoFragments, audioFragments } = job;
      const fragments = videoFragments.concat(
        audioFragments.map((fragment) => ({
          ...fragment,
          index: fragment.index + videoFragments.length,
        }))
      );
      return from(
        createBucketFactory(fs)(
          jobId,
          videoFragments.length,
          audioFragments.length
        ).then(() => ({
          fragments,
          jobId,
        }))
      );
    }),
    mergeMap(({ fragments, jobId }) =>
      from(fragments).pipe(
        mergeMap(
          (fragment) =>
            from(
              downloadSingleFactory(loader)(
                fragment,
                store$.value.config.fetchAttempts
              ).then((data) => ({
                fragment,
                data,
                jobId,
              }))
            ),

          store$.value.config.concurrency
        ),
        mergeMap(({ data, fragment, jobId }) =>
          decryptSingleFragmentFactory(loader, decryptor)(
            fragment.key,
            data,
            store$.value.config.fetchAttempts
          ).then((data) => ({
            fragment,
            data,
            jobId,
          }))
        ),
        mergeMap(({ data, jobId, fragment }) =>
          writeToBucketFactory(fs)(jobId, fragment.index, data).then(() => ({
            jobId,
          }))
        ),
        mergeMap(({ jobId }) =>
          of(
            jobsSlice.actions.incDownloadStatus({
              jobId,
            })
          )
        ),
        takeUntil(
          action$
            .pipe(filter(jobsSlice.actions.cancel.match))
            .pipe(filter((action) => action.payload.jobId === jobId))
        ),
        catchError((error: unknown) =>
          of(
            jobsSlice.actions.downloadFailed({
              jobId,
              message:
                (error as Error)?.message ||
                "Download failed during fragment processing",
            })
          )
        )
      )
    )
  );
