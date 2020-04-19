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
> = (action$, store, { loader, parser }) =>
  action$.pipe(
    filter(playlistsSlice.actions.fetchPlaylistLevels.match),
    map((action) => action.payload.playlistID),
    map((playlistID) => store.value.playlists.playlists[playlistID]!),
    mergeMap(
      ({ uri }) => from(getLevelsFactory(loader, parser)(uri)),
      ({ id }, levels) => ({
        levels,
        playlistID: id,
      })
    ),
    mergeMap(({ playlistID, levels }) => {
      if (levels.length === 0) {
        return of(
          playlistsSlice.actions.fetchPlaylistLevelsFailed({
            playlistID,
          })
        );
      }
      return of(
        playlistsSlice.actions.fetchPlaylistLevelsSuccess({
          playlistID,
        }),
        levelsSlice.actions.addLevels({
          levels,
        })
      );
    })
  );
