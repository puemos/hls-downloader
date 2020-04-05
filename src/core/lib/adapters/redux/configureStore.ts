import { Action, configureStore } from "@reduxjs/toolkit";
import { combineEpics, createEpicMiddleware } from "redux-observable";
import { addDownloadEpic } from "./downloads/addDownloadEpic";
import { rootReducer, RootState } from "./rootReducer";

const epicMiddleware = createEpicMiddleware<
  Action<any>,
  Action<any>,
  RootState
>();

const rootEpic = combineEpics(addDownloadEpic);

const store = configureStore<RootState>({
  reducer: rootReducer,
  middleware: [epicMiddleware],
});

epicMiddleware.run(rootEpic);

type AppDispatch = typeof store.dispatch;
