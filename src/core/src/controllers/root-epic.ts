import { combineEpics, Epic } from "redux-observable";
import { BehaviorSubject } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { RootState } from "../adapters/redux/root-reducer";
import { Dependencies } from "../services";
import * as epics from ".";

export function createRootEpic() {
  const epicsArray = Object.values({ ...epics });

  const epic$ = new BehaviorSubject(combineEpics(...epicsArray));

  const rootEpic: Epic<any, any, RootState, Dependencies> = (
    action$,
    state$,
    deps
  ) => epic$.pipe(mergeMap((epic) => epic(action$, state$, deps)));
  return rootEpic;
}
