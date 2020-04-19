import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../adapters/redux/root-reducer";
import { playlistsSlice } from "../adapters/redux/slices";
import { Dependencies } from "../services";

export const addPlaylistEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$) =>
  action$.pipe(
    filter(playlistsSlice.actions.addPlaylist.match),
    map((action) => action.payload),
    mergeMap(({ id }) =>
      of(
        playlistsSlice.actions.fetchPlaylistLevels({
          playlistID: id,
        })
      )
    )
  );
