import React from "react";
import ReactDOM from "react-dom";
import App from "./view/App";
import { Provider } from "react-redux";
import { Store } from "webext-redux";

import { ThemeProvider, CSSReset, ColorModeProvider } from "@chakra-ui/core";

(async () => {
  const store = new Store();

  await store.ready();

  ReactDOM.render(
    <Provider store={store}>
      <React.StrictMode>
        <ColorModeProvider value="dark">
          <ThemeProvider>
            <CSSReset></CSSReset>

            <App />
          </ThemeProvider>
        </ColorModeProvider>
      </React.StrictMode>
    </Provider>,
    document.getElementById("root")
  );
})();
