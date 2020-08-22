import { Epic, ofType } from "redux-observable";
import { from, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../adapters/redux/root-reducer";
import { Dependencies } from "../services";
import { fsCleanupFactory } from "../use-cases";
import { createAction } from "@reduxjs/toolkit";

export const fsCleanupOnInitEpic: Epic<
  RootAction,
  RootAction,
  RootState,
  Dependencies
> = (action$, _store$, { fs }) =>
  action$.pipe(
    ofType("init/start"),
    mergeMap(() => from(fsCleanupFactory(fs)())),
    mergeMap(() => of(createAction("init/done")()))
  );
