import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../adapters/redux/root-reducer";
import { jobsSlice } from "../adapters/redux/slices";
import { Dependencies } from "../services";

export const incDownloadStatusEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$) =>
  action$.pipe(
    filter(jobsSlice.actions.incDownloadStatus.match),
    map((action) => action.payload.jobId),
    map((id) => ({ id, status: store$.value.jobs.jobsStatus[id] })),
    filter(({ status }) => Boolean(status)),
    filter(({ status }) => status!.done === status!.total),
    mergeMap(({ id }) => {
      return of(
        jobsSlice.actions.finishDownload({
          jobId: id,
        }),
        jobsSlice.actions.saveAs({
          jobId: id,
        })
      );
    })
  );
