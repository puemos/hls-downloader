import { Epic } from "redux-observable";
import { from, of } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../adapters/redux/root-reducer";
import { jobsSlice } from "../adapters/redux/slices";
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
    map((action) => {
      return action.payload.jobId;
    }),
    mergeMap(
      (jobId) => from(deleteBucketFactory(fs)(jobId)),
      (jobId) => ({ jobId })
    ),
    mergeMap(({ jobId }) => of(jobsSlice.actions.deleteSuccess({ jobId })))
  );
