import { configureStore, Middleware } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { createRootEpic } from "../../controllers/root-epic";
import { Dependencies } from "../../services";
import { rootReducer, RootState, RootAction } from "./root-reducer";

export function createStore(dependencies: Dependencies) {
  const epicMiddleware = createEpicMiddleware<
    RootAction,
    RootAction,
    RootState
  >({ dependencies });

  const rootEpic = createRootEpic();

  const store = configureStore<RootState, RootAction, Middleware[]>({
    reducer: rootReducer,
    middleware: [/*logger*/ epicMiddleware],
  });

  epicMiddleware.run(rootEpic);

  return store;
}

export type Store = ReturnType<typeof createStore>;
