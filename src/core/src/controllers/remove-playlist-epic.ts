import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import {
  levelInspectionsSlice,
  levelsSlice,
  playlistPreferencesSlice,
  playlistsSlice,
} from "../store/slices";
import { Dependencies } from "../services";

export const removePlaylistEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$) =>
  action$.pipe(
    filter(playlistsSlice.actions.removePlaylist.match),
    mergeMap((action) => {
      const playlistID = action.payload.playlistID;
      return of(
        levelsSlice.actions.removePlaylistLevels({ playlistID }),
        levelInspectionsSlice.actions.removePlaylistInspections({ playlistID }),
        playlistPreferencesSlice.actions.removePlaylistPreferences({
          playlistID,
        }),
      );
    }),
  );
