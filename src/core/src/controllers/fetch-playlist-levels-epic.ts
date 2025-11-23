import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { playlistsSlice } from "../store/slices";
import { levelsSlice } from "../store/slices/levels-slice";
import { Dependencies } from "../services";
import { getLevelsFactory } from "../use-cases";

export const fetchPlaylistLevelsEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$, { loader, parser }) =>
  action$.pipe(
    filter(playlistsSlice.actions.fetchPlaylistLevels.match),
    map((action) => action.payload.playlistID),
    map((playlistID) => store$.value.playlists.playlists[playlistID]!),
    mergeMap(({ uri, id }) =>
      from(
        getLevelsFactory(loader, parser)(uri, store$.value.config.fetchAttempts)
      ).pipe(
        map((levels) => ({
          levels,
          playlistID: id,
          ok: true,
        })),
        catchError(() =>
          of({
            playlistID: id,
            levels: [],
            ok: false,
          })
        )
      )
    ),
    mergeMap(({ playlistID, levels, ok }) => {
      if (!ok || levels.length === 0) {
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
        levelsSlice.actions.add({
          levels,
        })
      );
    })
  );
