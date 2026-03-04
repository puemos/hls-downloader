import { Epic } from "redux-observable";
import { filter, map } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
import { Dependencies } from "../services";

export const autoDeleteAfterSaveEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, store$) =>
  action$.pipe(
    filter(jobsSlice.actions.saveAsSuccess.match),
    filter(() => store$.value.config.autoDeleteAfterSave),
    map((action) =>
      jobsSlice.actions.delete({ jobId: action.payload.jobId })
    )
  );
