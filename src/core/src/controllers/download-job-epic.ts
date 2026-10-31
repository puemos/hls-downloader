import { Epic } from "redux-observable";
import { EMPTY, concat, defer, from, of } from "rxjs";
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
  prepareJobFactory,
  storeSubtitleTextFactory,
  decryptSingleFragmentFactory,
  downloadSingleFactory,
  writeToBucketFactory,
} from "../use-cases";

export const downloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { fs, loader, parser, decryptor }) =>
  action$.pipe(
    filter(jobsSlice.actions.download.match),
    mergeMap(({ payload: { jobId } }) =>
      defer(() => {
        const job = store$.value.jobs.jobs[jobId];
        if (!job) return EMPTY;
        const controller = new AbortController();
        const { signal } = controller;
        const jobLoader: ILoader = {
          ...(loader.fetchTextResponse
            ? {
                fetchTextResponse: (url: string, attempts?: number) =>
                  loader.fetchTextResponse!(url, attempts, signal),
              }
            : {}),
          fetchText: (url, attempts) => loader.fetchText(url, attempts, signal),
          fetchArrayBuffer: (url, attempts, range) =>
            loader.fetchArrayBuffer(url, attempts, range, signal),
        };
        return defer(() =>
          from(
            prepareJobFactory(
              jobLoader,
              parser,
              decryptor,
            )(job, store$.value.config.fetchAttempts),
          ),
        ).pipe(
          mergeMap((prepared) => {
            signal.throwIfAborted();
            const { videoFragments, audioFragments } = prepared;
            const fragments = videoFragments.concat(
              audioFragments.map((fragment) => ({
                ...fragment,
                index: fragment.index + videoFragments.length,
              })),
            );
            if (!fragments.length)
              throw new Error("Download contains no media segments");
            return concat(
              job.source
                ? of(jobsSlice.actions.prepared({ job: prepared }))
                : EMPTY,
              defer(() =>
                from(
                  createBucketFactory(fs)(
                    jobId,
                    videoFragments.length,
                    audioFragments.length,
                  ).then(async () => {
                    if (signal.aborted) {
                      await fs.deleteBucket(jobId);
                      return;
                    }
                    if (prepared.subtitleText !== undefined) {
                      await storeSubtitleTextFactory(fs)(
                        jobId,
                        {
                          id: prepared.source?.subtitle?.id ?? jobId,
                          language: prepared.subtitleLanguage,
                          name: prepared.subtitleName,
                        },
                        prepared.source?.playlist ?? { uri: prepared.filename },
                        prepared.subtitleText,
                      );
                      if (signal.aborted) await fs.deleteBucket(jobId);
                    }
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
              ),
            );
          }),
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
