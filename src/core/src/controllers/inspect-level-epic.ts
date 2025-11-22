import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import { Dependencies } from "../services";
import { RootAction, RootState } from "../store/root-reducer";
import { levelInspectionsSlice } from "../store/slices";
import { inspectLevelEncryptionFactory } from "../use-cases";

export const inspectLevelEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, state$, { loader, parser }) =>
  action$.pipe(
    filter(levelInspectionsSlice.actions.inspect.match),
    map((action) => action.payload.levelId),
    mergeMap((levelId) => {
      const level = state$.value.levels.levels[levelId];
      if (!level) {
        return of(
          levelInspectionsSlice.actions.inspectFailed({
            levelId,
            message: "Level not found",
          }),
        );
      }

      return from(
        inspectLevelEncryptionFactory(loader, parser)(
          level,
          state$.value.config.fetchAttempts,
        ),
      ).pipe(
        map((inspection) =>
          levelInspectionsSlice.actions.inspectSuccess({ inspection }),
        ),
        catchError((error: unknown) =>
          of(
            levelInspectionsSlice.actions.inspectFailed({
              levelId,
              message:
                (error as Error)?.message ||
                "Unable to inspect encryption for level",
            }),
          ),
        ),
      );
    }),
  );
