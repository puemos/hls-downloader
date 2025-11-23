import { Epic } from "redux-observable";
import { EMPTY, of } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { configSlice, jobsSlice } from "../store/slices";
import { Dependencies } from "../services";

const shouldSchedule = (action: RootAction) =>
  jobsSlice.actions.add.match(action) ||
  jobsSlice.actions.queue.match(action) ||
  jobsSlice.actions.finishDownload.match(action) ||
  jobsSlice.actions.downloadFailed.match(action) ||
  jobsSlice.actions.deleteSuccess.match(action) ||
  jobsSlice.actions.cancel.match(action) ||
  configSlice.actions.setMaxActiveDownloads.match(action);

export const downloadQueueEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$) =>
  action$.pipe(
    filter(shouldSchedule),
    mergeMap(() => {
      const state = store$.value;
      const limit = state.config.maxActiveDownloads ?? 0;
      const jobs = state.jobs.jobs;
      const jobsStatus = state.jobs.jobsStatus;
      const queued = Object.keys(jobsStatus)
        .filter((id) => jobsStatus[id]?.status === "queued")
        .sort(
          (a, b) =>
            (jobs[a]?.createdAt ?? Number.MAX_SAFE_INTEGER) -
            (jobs[b]?.createdAt ?? Number.MAX_SAFE_INTEGER)
        );
      const activeCount = Object.values(jobsStatus).filter(
        (status) => status?.status === "downloading"
      ).length;
      const available =
        limit <= 0 ? queued.length : Math.max(0, limit - activeCount);
      if (available <= 0) {
        return EMPTY;
      }
      const toStart = queued.slice(0, available).map((jobId) =>
        jobsSlice.actions.download({
          jobId,
        })
      );
      return toStart.length ? of(...toStart) : EMPTY;
    })
  );
