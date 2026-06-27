import { combineEpics, Epic } from "redux-observable";
import { BehaviorSubject } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { RootAction, RootState } from "../store/root-reducer";
import { Dependencies } from "../services";
import * as epics from ".";

type RootEpic = Epic<RootAction, RootAction, RootState, Dependencies>;

export function createRootEpic(): RootEpic {
  const epicsArray = Object.values({ ...epics }) as RootEpic[];
  const epic$ = new BehaviorSubject<RootEpic>(combineEpics(...epicsArray));

  const rootEpic: RootEpic = (action$, state$, deps) =>
    epic$.pipe(mergeMap((epic) => epic(action$, state$, deps)));
  return rootEpic;
}
