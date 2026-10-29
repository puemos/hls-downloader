import { Epic } from "redux-observable";
import { EMPTY, defer, from, of } from "rxjs";
import {
  catchError,
  filter,
  finalize,
  mergeMap,
  takeUntil,
} from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
import { Dependencies, ILoader } from "../services";
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
    mergeMap(({ payload: { jobId } }) =>
      defer(() => {
        const job = store$.value.jobs.jobs[jobId];
        if (!job) return EMPTY;
        const controller = new AbortController();
        const { signal } = controller;
        const jobLoader: ILoader = {
          fetchText: (url, attempts) => loader.fetchText(url, attempts, signal),
          fetchArrayBuffer: (url, attempts, range) =>
            loader.fetchArrayBuffer(url, attempts, range, signal),
        };
        const { videoFragments, audioFragments } = job;
        const fragments = videoFragments.concat(
          audioFragments.map((fragment) => ({
            ...fragment,
            index: fragment.index + videoFragments.length,
          })),
        );
        // Bucket creation belongs inside the job's error/cancellation boundary.
        // If it finishes after cancellation, remove the otherwise orphaned data.
        return defer(() =>
          from(
            createBucketFactory(fs)(
              jobId,
              videoFragments.length,
              audioFragments.length,
            ).then(async () => {
              if (signal.aborted) await fs.deleteBucket(jobId);
            }),
          ),
        ).pipe(
          mergeMap(() =>
            from(fragments).pipe(
              mergeMap(async (fragment) => {
                const data = await downloadSingleFactory(jobLoader)(
                  fragment,
                  store$.value.config.fetchAttempts,
                );
                signal.throwIfAborted();
                const decrypted = await decryptSingleFragmentFactory(
                  jobLoader,
                  decryptor,
                )(fragment.key, data, store$.value.config.fetchAttempts);
                await writeToBucketFactory(fs)(
                  jobId,
                  fragment.index,
                  decrypted,
                  signal,
                );
                return jobsSlice.actions.incDownloadStatus({ jobId });
              }, store$.value.config.concurrency),
            ),
          ),
          takeUntil(
            action$.pipe(
              filter(
                (action) =>
                  jobsSlice.actions.clear.match(action) ||
                  ((jobsSlice.actions.cancel.match(action) ||
                    jobsSlice.actions.delete.match(action)) &&
                    action.payload.jobId === jobId),
              ),
            ),
          ),
          catchError((error: unknown) =>
            of(
              jobsSlice.actions.downloadFailed({
                jobId,
                message:
                  (error as Error)?.message ||
                  "Download failed during fragment processing",
              }),
            ),
          ),
          finalize(() => controller.abort()),
        );
      }),
    ),
  );
