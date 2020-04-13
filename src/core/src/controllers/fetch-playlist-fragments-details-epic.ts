import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState } from "../adapters/redux/root-reducer";
import {
  DownloadAction,
  downloadsActions,
} from "../adapters/redux/slices/downloads-slice";
import { Dependencies } from "../services";
import { getFragmentsDetailsFactory } from "../use-cases";

export const fetchPlaylistFragmentsDetailsEpic: Epic<
  DownloadAction,
  DownloadAction,
  RootState,
  Dependencies
> = (action$, _store, { loader, parser, fs }) => {
  return action$.pipe(
    filter(downloadsActions.downloadPlaylist.match),
    map((action) => action.payload.playlist),
    mergeMap(
      (playlist) =>
        from(getFragmentsDetailsFactory(loader, parser)(playlist)).pipe(),
      (playlist, fragments) => ({
        fragments,
        playlist,
      })
    ),
    mergeMap(({ fragments, playlist }) =>
      of(
        downloadsActions.fetchPlaylistFragmentsDetails({
          fragments: fragments,
          playlistID: playlist.id,
        })
      )
    )
  );
};
