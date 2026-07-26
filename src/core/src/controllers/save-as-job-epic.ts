import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
import { Dependencies } from "../services";
import { prepareDownloadBucketFactory, saveAsFactory } from "../use-cases";

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
      const container =
        job.outputContainer ??
        (job.filename.toLowerCase().endsWith(".mkv") ? "mkv" : "mp4");

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
            prepareDownloadBucketFactory(fs)(
              jobId,
              (progress, message) =>
                jobsSlice.actions.setSaveProgress({
                  jobId,
                  progress,
                  message,
                }),
              { container },
            ),
          ),
        ),
        mergeMap((download) =>
          from(
            saveAsFactory(fs)(job.filename, download, {
              dialog,
            }),
          ).pipe(
            map(() => jobsSlice.actions.saveAsSuccess({ jobId: job.id })),
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
