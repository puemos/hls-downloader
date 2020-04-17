import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap, mapTo, mergeMapTo } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import { getLevelsFactory } from "../use-cases";
import { playlistsSlice } from "../adapters/redux/slices";

export const fetchPlaylistLevelsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store, { loader, parser }) =>
  action$.pipe(
    filter(playlistsSlice.actions.fetchPlaylistLevels.match),
    map((action) => action.payload),
    mergeMap(
      ({ uri }) => from(getLevelsFactory(loader, parser)(uri)),
      ({ playlistID }, levels) => ({
        levels,
        playlistID,
      })
    ),
    mergeMap(({ playlistID, levels }) =>
      of(
        playlistsSlice.actions.fetchPlaylistLevelsSuccess({
          playlistID,
          levels,
        }),
        levelsSlice.actions.addLevels({
          levels,
        })
      )
    )
  );
