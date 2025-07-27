import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
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
    mergeMap((jobId) =>
      from(
        getLinkBucketFactory(fs)(jobId, (progress, message) =>
          jobsSlice.actions.setSaveProgress({
            jobId,
            progress,
            message,
          })
        )
      ).pipe(map((link) => ({ jobId, link })))
    ),
    map(({ jobId, link }) => ({
      job: store$.value.jobs.jobs[jobId]!,
      dialog: store$.value.config.saveDialog,
      link,
    })),
    mergeMap(({ dialog, link, job }) =>
      from(
        saveAsFactory(fs)(job.filename, link, {
          dialog,
        })
      ).pipe(map(() => ({ job, link })))
    ),
    mergeMap(({ job, link }) =>
      of(jobsSlice.actions.saveAsSuccess({ jobId: job.id, link }))
    )
  );
