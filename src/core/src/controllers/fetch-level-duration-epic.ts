import { Epic } from "redux-observable";
import { from, of, EMPTY } from "rxjs";
import { filter, mergeMap, catchError } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { levelsSlice } from "../store/slices/levels-slice";
import { Dependencies } from "../services";
import { getPlaylistDurationFactory } from "../use-cases";

export const fetchLevelDurationEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, state$, { loader }) =>
  action$.pipe(
    filter(levelsSlice.actions.add.match),
    mergeMap((action) => {
      const fetchAttempts = state$.value.config.fetchAttempts;
      const addedLevels = action.payload.levels;
      if (!addedLevels?.length) {
        return EMPTY;
      }
      const toFetch = addedLevels.filter(
        (level) => state$.value.levels.durations[level.id] === undefined
      );
      if (!toFetch.length) {
        return EMPTY;
      }
      const run = getPlaylistDurationFactory(loader);
      return from(toFetch).pipe(
        mergeMap((level) =>
          from(run(level.uri, null, fetchAttempts)).pipe(
            mergeMap((durationSec) =>
              of(
                levelsSlice.actions.setDuration({
                  levelId: level.id,
                  durationSec,
                })
              )
            ),
            catchError(() =>
              of(
                levelsSlice.actions.setDuration({
                  levelId: level.id,
                  durationSec: null,
                })
              )
            )
          )
        )
      );
    })
  );
