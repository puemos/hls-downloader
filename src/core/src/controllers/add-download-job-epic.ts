import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../store/root-reducer";
import { levelsSlice } from "../store/slices/levels-slice";
import { Dependencies } from "../services";
import { generateFileName } from "../use-cases";
import { jobsSlice } from "../store/slices/jobs-slice";
import type { OutputContainer } from "../entities";

export const addDownloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$) =>
  action$.pipe(
    filter(levelsSlice.actions.download.match),
    mergeMap(({ payload: { levelID, audioLevelID, subtitleLevelID } }) => {
      const jobId =
        (crypto as any)?.randomUUID?.() ??
        `job-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const video = store$.value.levels.levels[levelID];
      const audio = audioLevelID
        ? store$.value.levels.levels[audioLevelID]
        : undefined;
      const subtitle = subtitleLevelID
        ? store$.value.levels.levels[subtitleLevelID]
        : undefined;
      const playlist = video
        ? store$.value.playlists.playlists[video.playlistID]
        : null;
      if (!video || !playlist)
        return of(
          jobsSlice.actions.downloadFailed({
            jobId,
            message: "Unable to start download: playlist not found",
          }),
        );
      const container: OutputContainer = subtitle
        ? "mkv"
        : (store$.value.config.outputContainer ?? "mp4");
      // Materialize the job before network I/O so preparation is visible,
      // cancellable, and scheduled under the same concurrency limit as media.
      return of(
        jobsSlice.actions.add({
          job: {
            id: jobId,
            playlistId: playlist.id,
            videoFragments: [],
            audioFragments: [],
            filename: generateFileName()(playlist, video, { container }),
            outputContainer: container,
            createdAt: Date.now(),
            bitrate: video.bitrate,
            width: video.width,
            height: video.height,
            source: {
              playlist,
              video,
              audio: audio ?? undefined,
              subtitle: subtitle ?? undefined,
            },
          },
        }),
      );
    }),
  );
