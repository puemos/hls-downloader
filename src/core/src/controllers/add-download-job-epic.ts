import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../store/root-reducer";
import { levelsSlice } from "../store/slices/levels-slice";
import { Dependencies } from "../services";
import {
  getFragmentsDetailsFactory,
  generateFileName,
  getSubtitleTextFactory,
  storeSubtitleTextFactory,
} from "../use-cases";
import { jobsSlice } from "../store/slices/jobs-slice";

export const addDownloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { loader, parser, fs }) =>
  action$.pipe(
    filter(levelsSlice.actions.download.match),
    map((action) => action.payload),
    mergeMap(({ levelID, audioLevelID, subtitleLevelID }) => {
      const jobId =
        (crypto as any)?.randomUUID?.() ??
        `job-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const videoLevel = store$.value.levels.levels[levelID];
      const audioLevel = audioLevelID
        ? store$.value.levels.levels[audioLevelID]
        : undefined;
      const subtitleLevel = subtitleLevelID
        ? store$.value.levels.levels[subtitleLevelID]
        : undefined;
      const playlist = videoLevel
        ? store$.value.playlists.playlists[videoLevel.playlistID]
        : null;

      if (!videoLevel || !playlist) {
        return of(
          jobsSlice.actions.downloadFailed({
            jobId,
            message: "Unable to start download: playlist not found",
          })
        );
      }

      const baseUri = videoLevel.playlistID;
      const fetchAttempts = store$.value.config.fetchAttempts;

      return from(
        (async () => {
          const [videoFragments, audioFragments, subtitleText] =
            await Promise.all([
              getFragmentsDetailsFactory(loader, parser)(
                videoLevel,
                fetchAttempts,
                {
                  baseUri,
                }
              ),
              audioLevel
                ? getFragmentsDetailsFactory(loader, parser)(
                    audioLevel,
                    fetchAttempts,
                    {
                      baseUri,
                    }
                  )
                : Promise.resolve([]),
              subtitleLevel
                ? getSubtitleTextFactory(loader, parser)(
                    subtitleLevel,
                    fetchAttempts,
                    {
                      baseUri,
                    }
                  )
                : Promise.resolve(null),
            ]);

          const container = subtitleLevel ? "mkv" : "mp4";
          const actions: RootAction[] = [
            jobsSlice.actions.add({
              job: {
                id: jobId,
                playlistId: playlist.id,
                videoFragments,
                audioFragments,
                filename: generateFileName()(playlist, videoLevel, {
                  container,
                }),
                createdAt: Date.now(),
                bitrate: videoLevel.bitrate,
                width: videoLevel.width,
                height: videoLevel.height,
                subtitleText:
                  subtitleText !== undefined && subtitleText !== null
                    ? subtitleText
                    : undefined,
                subtitleLanguage: subtitleLevel?.language,
                subtitleName: subtitleLevel?.name,
              },
            }),
          ];

          if (
            subtitleLevel &&
            subtitleLevel.type === "subtitle" &&
            subtitleText !== undefined &&
            subtitleText !== null
          ) {
            console.log("[add-download-job] storing subtitle text", {
              jobId,
              subtitleLevelId: subtitleLevel.id,
              subtitleLength: subtitleText.length,
            });
            await storeSubtitleTextFactory(fs)(
              jobId,
              subtitleLevel,
              playlist,
              subtitleText
            );
          }

          return actions;
        })()
      ).pipe(
        mergeMap((acts) => of(...acts)),
        catchError((error: unknown) =>
          of(
            jobsSlice.actions.downloadFailed({
              jobId,
              message:
                (error as Error)?.message ?? "Failed to prepare download",
            })
          )
        )
      );
    })
  );
