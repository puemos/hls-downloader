import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { Dependencies } from "../services";
import { subtitlesSlice } from "../store/slices/subtitles-slice";
import { downloadSubtitleTrackFactory } from "../use-cases";

export const downloadSubtitleEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { loader, parser, fs }) =>
  action$.pipe(
    filter(subtitlesSlice.actions.download.match),
    mergeMap(({ payload: { levelID, playlistID } }) => {
      const level = store$.value.levels.levels[levelID];
      const playlist = store$.value.playlists.playlists[playlistID];
      if (!level || level.type !== "subtitle" || !playlist) {
        return of(
          subtitlesSlice.actions.downloadFailed({
            levelID,
            message: "Subtitle track not found",
          })
        );
      }
      return from(
        downloadSubtitleTrackFactory(loader, parser, fs)(
          level,
          playlist,
          store$.value.config.fetchAttempts,
          store$.value.config.saveDialog
        )
      ).pipe(
        mergeMap((filename) =>
          of(
            subtitlesSlice.actions.downloadSuccess({
              levelID,
              filename,
            })
          )
        ),
        catchError((error: unknown) =>
          of(
            subtitlesSlice.actions.downloadFailed({
              levelID,
              message: (error as Error)?.message ?? "Subtitle download failed",
            })
          )
        )
      );
    })
  );
