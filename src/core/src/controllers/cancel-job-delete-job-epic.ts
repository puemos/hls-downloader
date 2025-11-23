import { Epic } from "redux-observable";
import { of } from "rxjs";
import { filter, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
import { Dependencies } from "../services";

export const cancelJobdeleteJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store$, { fs }) =>
  action$.pipe(
    filter(jobsSlice.actions.cancel.match),
    mergeMap(({ payload: { jobId } }) =>
      of(jobsSlice.actions.delete({ jobId }))
    )
  );
