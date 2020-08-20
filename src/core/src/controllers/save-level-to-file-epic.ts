import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import {
  getLinkBucketFactory,
  saveAsFactory,
  generateFileName,
} from "../use-cases";

export const saveAsLevelEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { fs }) =>
  action$.pipe(
    filter(levelsSlice.actions.saveAsLevel.match),
    map((action) => action.payload.levelID),
    mergeMap(
      (levelID) => from(getLinkBucketFactory(fs)(levelID)),
      (levelID, link) => ({ levelID, link })
    ),
    map(({ levelID, link }) => ({
      level: store$.value.levels.levels[levelID]!,
      link,
    })),
    map(({ level, link }) => ({
      level,
      playlist: store$.value.playlists.playlists[level.playlistID]!,
      link,
    })),
    map(({ level, link, playlist }) => ({
      level,
      filename: generateFileName()(playlist, level),
      dialog: store$.value.config.saveDialog,
      link,
    })),
    mergeMap(
      ({ dialog, filename, link }) =>
        from(
          saveAsFactory(fs)(filename, link, {
            dialog,
          })
        ),
      ({ level }) => ({ level })
    ),
    mergeMap(({ level }) =>
      of(levelsSlice.actions.saveAsLevelSuccess({ levelID: level.id }))
    )
  );
