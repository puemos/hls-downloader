import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
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
    map(({ levelID, audioLevelID, subtitleLevelID }) => ({
      videoLevel: store$.value.levels.levels[levelID]!,
      audioLevel: audioLevelID
        ? store$.value.levels.levels[audioLevelID]!
        : undefined,
      subtitleLevel: subtitleLevelID
        ? store$.value.levels.levels[subtitleLevelID]!
        : undefined,
    })),
    mergeMap(({ videoLevel, audioLevel, subtitleLevel }) =>
      from(
        Promise.all([
          getFragmentsDetailsFactory(loader, parser)(
            videoLevel,
            store$.value.config.fetchAttempts
          ),
          audioLevel
            ? getFragmentsDetailsFactory(loader, parser)(
                audioLevel,
                store$.value.config.fetchAttempts
              )
            : Promise.resolve([]),
          subtitleLevel
            ? getSubtitleTextFactory(loader, parser)(
                subtitleLevel,
                store$.value.config.fetchAttempts
              )
            : Promise.resolve(null),
        ])
      ).pipe(
        map(([videoFragments, audioFragments, subtitleText]) => ({
          videoLevel,
          audioLevel,
          subtitleLevel,
          videoFragments,
          audioFragments,
          subtitleText,
        }))
      )
    ),
    map(
      ({
        videoLevel,
        audioLevel,
        subtitleLevel,
        subtitleText,
        videoFragments,
        audioFragments,
      }) => ({
        videoLevel,
        audioLevel,
        subtitleLevel,
        subtitleText,
        videoFragments,
        audioFragments,
        playlist: store$.value.playlists.playlists[videoLevel.playlistID]!,
      })
    ),
    map(
      ({
        videoLevel,
        audioLevel,
        subtitleLevel,
        subtitleText,
        videoFragments,
        audioFragments,
        playlist,
      }) => {
        const container = subtitleLevel ? "mkv" : "mp4";
        return {
          level: videoLevel,
          filename: generateFileName()(playlist, videoLevel, { container }),
          videoFragments,
          audioFragments,
          subtitleLevel,
          subtitleText,
          playlist,
          container,
        };
      }
    ),
    mergeMap(
      ({
        videoFragments,
        audioFragments,
        level,
        filename,
        subtitleLevel,
        subtitleText,
        playlist,
        container,
      }) => {
        const jobId =
          (crypto as any)?.randomUUID?.() ??
          `job-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const actions: RootAction[] = [
          jobsSlice.actions.add({
            job: {
              id: jobId,
              videoFragments,
              audioFragments,
              filename,
              createdAt: Date.now(),
              bitrate: level.bitrate,
              width: level.width,
              height: level.height,
              subtitleText:
                subtitleText !== undefined && subtitleText !== null
                  ? subtitleText
                  : undefined,
              subtitleLanguage: subtitleLevel?.language,
              subtitleName: subtitleLevel?.name,
            },
          }),
        ];

        const storeAndEmit$ = from(
          (async () => {
            if (
              subtitleLevel &&
              subtitleLevel.type === "subtitle" &&
              subtitleText !== undefined &&
              subtitleText !== null
            ) {
              console.log("[add-download-job] storing subtitle text", {
                jobId,
                subtitleLevelId: subtitleLevel.id,
                subtitleLength: subtitleText?.length ?? 0,
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
        );

        return storeAndEmit$.pipe(mergeMap((acts) => of(...acts)));
      }
    )
  );
