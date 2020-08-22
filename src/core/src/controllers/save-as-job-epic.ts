import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../adapters/redux/root-reducer";
import { jobsSlice } from "../adapters/redux/slices";
import { Dependencies } from "../services";
import { getLinkBucketFactory, saveAsFactory } from "../use-cases";

export const saveAsJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { fs }) =>
  action$.pipe(
    filter(jobsSlice.actions.saveAs.match),
    map((action) => action.payload.jobId),
    mergeMap(
      (jobId) => from(getLinkBucketFactory(fs)(jobId)),
      (jobId, link) => ({ jobId, link })
    ),
    map(({ jobId, link }) => ({
      job: store$.value.jobs.jobs[jobId]!,
      dialog: store$.value.config.saveDialog,
      link,
    })),
    mergeMap(
      ({ dialog, link, job }) =>
        from(
          saveAsFactory(fs)(job.filename, link, {
            dialog,
          })
        ),
      ({ job }) => ({ job })
    ),
    mergeMap(({ job }) =>
      of(jobsSlice.actions.saveAsSuccess({ jobId: job.id }))
    )
  );
