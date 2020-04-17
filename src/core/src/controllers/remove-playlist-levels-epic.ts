import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";
import { playlistsSlice } from "../adapters/redux/slices";

export const removePlaylistLevelsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store, { loader, parser }) =>
  action$.pipe(
    filter(playlistsSlice.actions.fetchPlaylistLevels.match),
    map((action) => action.payload.playlistID),
    mergeMap((playlistID) =>
      of(levelsSlice.actions.removePlaylistLevels({ playlistID }))
    )
  );
