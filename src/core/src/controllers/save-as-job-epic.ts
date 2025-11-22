import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
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
    mergeMap((jobId) => {
      const job = store$.value.jobs.jobs[jobId]!;
      const dialog = store$.value.config.saveDialog;

      const ensureSubtitle$ =
        job?.subtitleText !== undefined && job.subtitleText !== null
          ? from(
              fs.setSubtitleText(jobId, {
                text: job.subtitleText!,
                language: job.subtitleLanguage,
                name: job.subtitleName,
              }),
            ).pipe(
              map(() => {
                console.log("[subtitle] re-stored before save", {
                  jobId,
                  hasText: true,
                  language: job.subtitleLanguage,
                });
                return null;
              }),
            )
          : of(null);

      return ensureSubtitle$.pipe(
        mergeMap(() =>
          from(
            getLinkBucketFactory(fs)(jobId, (progress, message) =>
              jobsSlice.actions.setSaveProgress({
                jobId,
                progress,
                message,
              }),
            ),
          ),
        ),
        mergeMap((link) =>
          from(
            saveAsFactory(fs)(job.filename, link, {
              dialog,
            }),
          ).pipe(
            map(() => jobsSlice.actions.saveAsSuccess({ jobId: job.id, link })),
            catchError((error: unknown) =>
              of(
                jobsSlice.actions.downloadFailed({
                  jobId,
                  message:
                    (error as Error)?.message ||
                    "Failed to finalize download (mux or save)",
                }),
              ),
            ),
          ),
        ),
        catchError((error: unknown) =>
          of(
            jobsSlice.actions.downloadFailed({
              jobId,
              message:
                (error as Error)?.message ||
                "Failed to prepare download (mux or save)",
            }),
          ),
        ),
      );
    }),
  );
