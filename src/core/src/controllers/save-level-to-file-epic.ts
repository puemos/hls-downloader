import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import {
  mergeBucketFactory,
  writeToFileFactory,
  generateFileName,
} from "../use-cases";

export const saveLevelToFileEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { fs }) =>
  action$.pipe(
    filter(levelsSlice.actions.saveLevelToFile.match),
    map((action) => action.payload.levelID),
    mergeMap(
      (levelID) => from(mergeBucketFactory(fs)(levelID)),
      (levelID, data) => ({ levelID, data })
    ),
    map(({ levelID, data }) => ({
      level: store$.value.levels.levels[levelID]!,
      data,
    })),
    map(({ level, data }) => ({
      level,
      playlist: store$.value.playlists.playlists[level.playlistID]!,
      data,
    })),
    map(({ level, data, playlist }) => ({
      level,
      filename: generateFileName()(playlist, level),
      dialog: store$.value.config.saveDialog,
      data,
    })),
    mergeMap(
      ({ dialog, filename, data }) =>
        from(
          writeToFileFactory(fs)(filename, data, {
            dialog,
          })
        ),
      ({ level }) => ({ level })
    ),
    mergeMap(({ level }) =>
      of(levelsSlice.actions.saveLevelToFileSuccess({ levelID: level.id }))
    )
  );
