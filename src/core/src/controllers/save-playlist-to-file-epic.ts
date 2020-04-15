import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import { mergeBucketFactory, writeToFileFactory } from "../use-cases";

export const savePlaylistToFileEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store$, { fs }) =>
  action$.pipe(
    filter(levelsSlice.actions.saveLevelToFile.match),
    map((action) => action.payload.levelID),
    mergeMap(
      (levelID) => from(mergeBucketFactory(fs)(levelID)),
      (levelID, data) => ({ levelID, data })
    ),
    mergeMap(
      ({ levelID, data }) =>
        from(writeToFileFactory(fs)(`${levelID}.mp4`, data)),
      ({ levelID }) => ({ levelID })
    ),
    mergeMap(({ levelID }) =>
      of(levelsSlice.actions.saveLevelToFileSuccess({ levelID: levelID }))
    )
  );
