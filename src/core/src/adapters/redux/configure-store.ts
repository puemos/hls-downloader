import { configureStore, Middleware } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";
import { createRootEpic } from "../../controller/root-epic";
import { Dependencies } from "../../services";
import { DownloadAction } from "./downloads-slice";
import { rootReducer, RootState } from "./root-reducer";

export function createStore(dependencies: Dependencies) {
  const epicMiddleware = createEpicMiddleware<
    DownloadAction,
    DownloadAction,
    RootState
  >({ dependencies });

  const rootEpic = createRootEpic();

  const store = configureStore<RootState, DownloadAction, Middleware[]>({
    reducer: rootReducer,
    middleware: [/*logger*/ epicMiddleware],
  });

  epicMiddleware.run(rootEpic);

  return store;
}

export type Store = ReturnType<typeof createStore>;
