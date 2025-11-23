import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { jobsSlice } from "../store/slices";
import { Dependencies } from "../services";
import { deleteBucketFactory } from "../use-cases";

export const deleteJobEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store$, { fs }) =>
  action$.pipe(
    filter(jobsSlice.actions.delete.match),
    map((action) => action.payload.jobId),
    mergeMap((jobId) =>
      from(deleteBucketFactory(fs)(jobId)).pipe(
        catchError(() => of(null)),
        map(() => jobId)
      )
    ),
    mergeMap((jobId) => of(jobsSlice.actions.deleteSuccess({ jobId })))
  );
