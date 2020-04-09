import { Action, configureStore, Middleware } from "@reduxjs/toolkit";
import { combineEpics, createEpicMiddleware } from "redux-observable";
import { downloadPlaylistEpics } from "../../controller/downloadPlaylistEpics";
import { Dependencies } from "../../services/Dependencies";
import { rootReducer, RootState } from "./rootReducer";
import logger from "redux-logger";

export function createStore(dependencies: Dependencies) {
  const epicMiddleware = createEpicMiddleware<
    Action<any>,
    Action<any>,
    RootState
  >({ dependencies });

  const rootEpic = combineEpics(downloadPlaylistEpics);

  const store = configureStore<RootState, Action<any>, Middleware[]>({
    reducer: rootReducer,
    middleware: [/*logger*/ epicMiddleware],
  });

  epicMiddleware.run(rootEpic);

  return store;
}
