import { Epic } from "redux-observable";
import { concat, from, of, EMPTY } from "rxjs";
import {
  catchError,
  filter,
  map,
  mergeMap,
  throttleTime,
} from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { storageSlice, jobsSlice } from "../store/slices";
import { Dependencies } from "../services";
import { fsCleanupFactory, getStorageStatsFactory } from "../use-cases";

export const fetchStorageStatsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store$, { fs }) =>
  action$.pipe(
    filter(storageSlice.actions.refresh.match),
    mergeMap(() =>
      from(getStorageStatsFactory(fs)()).pipe(
        map((stats) => storageSlice.actions.refreshSuccess(stats)),
        catchError((error: unknown) =>
          of(
            storageSlice.actions.refreshFailure({
              error:
                (error as Error)?.message ??
                "Failed to read storage information",
            })
          )
        )
      )
    )
  );

const STORAGE_TRIGGER_ACTIONS: Array<(action: RootAction) => boolean> = [
  jobsSlice.actions.incDownloadStatus.match,
  jobsSlice.actions.finishDownload.match,
  jobsSlice.actions.downloadFailed.match,
  jobsSlice.actions.deleteSuccess.match,
  jobsSlice.actions.queue.match,
  storageSlice.actions.cleanupSuccess.match,
  storageSlice.actions.cleanupFailure.match,
  (_action) => _action.type === "init/done",
];

export const autoRefreshStorageStatsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$) =>
  action$.pipe(
    filter((action) => STORAGE_TRIGGER_ACTIONS.some((match) => match(action))),
    throttleTime(800, undefined, { leading: true, trailing: true }),
    map(() => storageSlice.actions.refresh())
  );

export const cleanupStorageEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, state$, { fs }) =>
  action$.pipe(
    filter(storageSlice.actions.startCleanup.match),
    mergeMap(() => {
      const jobsState = state$.value.jobs.jobsStatus;
      const cancellableJobs = Object.keys(jobsState).filter((jobId) => {
        const status = jobsState[jobId];
        if (!status) {
          return false;
        }
        return ["downloading", "queued", "saving", "ready"].includes(
          status.status
        );
      });

      const cancelActions = cancellableJobs.map((jobId) =>
        jobsSlice.actions.cancel({ jobId })
      );

      return concat(
        cancelActions.length ? of(...cancelActions) : EMPTY,
        from(fsCleanupFactory(fs)()).pipe(
          mergeMap(() =>
            of(
              storageSlice.actions.cleanupSuccess(),
              jobsSlice.actions.clear(),
              storageSlice.actions.refresh()
            )
          ),
          catchError((error: unknown) =>
            of(
              storageSlice.actions.cleanupFailure({
                error:
                  (error as Error)?.message ??
                  "Failed to clean IndexedDB storage",
              })
            )
          )
        )
      );
    })
  );
