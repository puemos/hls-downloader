import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../store/root-reducer";
import { levelsSlice } from "../store/slices/levels-slice";
import { Dependencies } from "../services";
import { getFragmentsDetailsFactory, generateFileName } from "../use-cases";
import { jobsSlice } from "../store/slices/jobs-slice";

export const addDownloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { loader, parser }) =>
  action$.pipe(
    filter(levelsSlice.actions.download.match),
    map((action) => action.payload),
    map(({ levelID, audioLevelID }) => ({
      videoLevel: store$.value.levels.levels[levelID]!,
      audioLevel: audioLevelID
        ? store$.value.levels.levels[audioLevelID]!
        : undefined,
    })),
    mergeMap(({ videoLevel, audioLevel }) =>
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
        ])
      ).pipe(
        map(([videoFragments, audioFragments]) => ({
          videoLevel,
          audioLevel,
          videoFragments,
          audioFragments,
        }))
      )
    ),
    map(({ videoLevel, audioLevel, videoFragments, audioFragments }) => ({
      videoLevel,
      audioLevel,
      videoFragments,
      audioFragments,
      playlist: store$.value.playlists.playlists[videoLevel.playlistID]!,
    })),
    map(
      ({
        videoLevel,
        audioLevel,
        videoFragments,
        audioFragments,
        playlist,
      }) => ({
        level: videoLevel,
        filename: generateFileName()(playlist, videoLevel),
        videoFragments,
        audioFragments,
      })
    ),
    mergeMap(({ videoFragments, audioFragments, level, filename }) =>
      of(
        jobsSlice.actions.add({
          job: {
            id: `${filename}/${new Date().toISOString()}`,
            videoFragments,
            audioFragments,
            filename,
            createdAt: Date.now(),
            bitrate: level.bitrate,
            width: level.width,
            height: level.height,
          },
        })
      )
    )
  );
