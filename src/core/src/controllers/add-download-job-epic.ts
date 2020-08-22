import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import { getFragmentsDetailsFactory, generateFileName } from "../use-cases";
import { jobsSlice } from "../adapters/redux/slices/jobs-slice";

export const addDownloadJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { loader, parser }) =>
  action$.pipe(
    filter(levelsSlice.actions.download.match),
    map((action) => action.payload.levelID),
    map((levelID) => store$.value.levels.levels[levelID]),
    map((level) => level!),
    mergeMap(
      (level) => from(getFragmentsDetailsFactory(loader, parser)(level)),
      (level, fragments) => ({
        fragments,
        level,
      })
    ),
    map(({ level, fragments }) => ({
      level,
      fragments,
      playlist: store$.value.playlists.playlists[level.playlistID]!,
    })),
    map(({ level, fragments, playlist }) => ({
      level,
      filename: generateFileName()(playlist, level),
      fragments,
    })),
    mergeMap(({ fragments, level, filename }) =>
      of(
        jobsSlice.actions.add({
          job: {
            id: `${filename}/${new Date().toISOString()}`,
            fragments: fragments,
            filename: filename,
            createdAt: Date.now(),
            bitrate: level.bitrate,
            width: level.width,
            height: level.height,
          },
        })
      )
    )
  );
