import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "webext-redux";
import { Theme } from "./view/Theme";
import App from "./view/App";

(async () => {
  const store = new Store();

  await store.ready();

  ReactDOM.render(
    <Provider store={store}>
      <React.StrictMode>
        <Theme>
          <App />
        </Theme>
      </React.StrictMode>
    </Provider>,
    document.getElementById("root")
  );
})();
