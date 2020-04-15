import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootState, RootAction } from "../adapters/redux/root-reducer";
import { levelsSlice } from "../adapters/redux/slices/levels-slice";
import { Dependencies } from "../services";

export const incDownloadStatusEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$) =>
  action$.pipe(
    filter(levelsSlice.actions.incLevelDownloadStatus.match),
    map((action) => action.payload.levelID),
    map((id) => ({ id, status: store$.value.playlists.playlistsStatus[id] })),
    filter(({ status }) => status.done === status.total),
    mergeMap(({ id }) =>
      of(
        levelsSlice.actions.finishLevelDownload({
          levelID: id,
        })
      )
    )
  );
