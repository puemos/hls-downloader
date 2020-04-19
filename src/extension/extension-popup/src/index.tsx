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
            <style>
              {`
              html {
                --scrollbarBG: #1A202C;
                --thumbBG: #2c323d;
              }
              .App::-webkit-scrollbar {
                width: 1rem;
              }
              .App {
                scrollbar-width: thin;
                scrollbar-color: var(--thumbBG) var(--scrollbarBG);
              }
              .App::-webkit-scrollbar-track {
                background: var(--scrollbarBG);
              }
              .App::-webkit-scrollbar-thumb {
                background-color: var(--thumbBG) ;
                border-radius: 1rem;
                border: 5px solid var(--scrollbarBG);
              }
              `}
            </style>
            <App />
          </ThemeProvider>
        </ColorModeProvider>
      </React.StrictMode>
    </Provider>,
    document.getElementById("root")
  );
})();
