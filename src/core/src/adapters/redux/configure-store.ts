import { configureStore, Middleware } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { createRootEpic } from "../../controllers/root-epic";
import { Dependencies } from "../../services";
import { rootReducer, RootState, RootAction } from "./root-reducer";
import logger from "redux-logger";

const _dummy: Middleware = () => (next) => (action) => next(action);

export function createStore(
  dependencies: Dependencies,
  preloadedState: RootState = rootReducer(undefined, { type: "init" })
) {
  const epicMiddleware = createEpicMiddleware<
    RootAction,
    RootAction,
    RootState
  >({ dependencies });

  const rootEpic = createRootEpic();

  const store = configureStore<RootState, RootAction, Middleware[]>({
    reducer: rootReducer,
    middleware: [logger, epicMiddleware],
    preloadedState,
  });

  epicMiddleware.run(rootEpic);
  store.dispatch({
    type: "init/start",
  });
  return store;
}

export type Store = ReturnType<typeof createStore>;
