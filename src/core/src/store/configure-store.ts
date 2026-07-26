import { configureStore, Tuple } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { createRootEpic } from "../controllers/root-epic";
import { Dependencies } from "../services";
import { rootReducer, RootAction, RootState } from "./root-reducer";
import { logger } from "redux-logger";

export function createStore(
  dependencies: Dependencies,
  preloadedState?: Partial<RootState>,
) {
  const epicMiddleware = createEpicMiddleware<
    RootAction,
    RootAction,
    RootState
  >({ dependencies });

  const rootEpic = createRootEpic();
  const store = configureStore({
    reducer: rootReducer,
    middleware: () => new Tuple(logger, epicMiddleware),
    preloadedState,
  });

  epicMiddleware.run(rootEpic);
  store.dispatch({
    type: "init/start",
  });
  return store;
}

export type Store = ReturnType<typeof createStore>;
