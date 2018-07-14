import { wrapStore } from "react-chrome-redux";
import { applyMiddleware, createStore } from "redux";
import createSagaMiddleware from "redux-saga";

import { composeWithDevTools } from "remote-redux-devtools";
import { middleware } from "../router/middleware";
import reducer from "./reducers";
import sagas from "./sagas";

const sagaMiddleware = createSagaMiddleware();
const middlewares = [sagaMiddleware, middleware];
let enhancers = applyMiddleware(...middlewares);

if (process.env.NODE_ENV === "development") {
  const composeEnhancers = composeWithDevTools({ realtime: true, port: 8000 });
  enhancers = composeEnhancers(
    applyMiddleware(...middlewares)
    // other store enhancers if any
  );
}

export const store = createStore(
  reducer,
  /* preloadedState, */
  enhancers
);

sagaMiddleware.run(sagas);
wrapStore(store, { portName: "HLS_DOWNLOADER" });
