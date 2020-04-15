import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import { getFragmentsDetailsFactory } from "../use-cases";

export const fetchPlaylistFragmentsDetailsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store, { loader, parser }) =>
  action$.pipe(
    filter(levelsSlice.actions.downloadLevel.match),
    map((action) => action.payload.level),
    mergeMap(
      (level) => from(getFragmentsDetailsFactory(loader, parser)(level)).pipe(),
      (level, fragments) => ({
        fragments,
        level,
      })
    ),
    mergeMap(({ fragments, level }) =>
      of(
        levelsSlice.actions.fetchLevelFragmentsDetails({
          fragments: fragments,
          levelID: level.id,
        })
      )
    )
  );
