import React from "react";
import ReactDOM from "react-dom";
import App from "./view/App";
import { Provider } from "react-redux";
import { Store } from "webext-redux";

import {
  ThemeProvider,
  CSSReset,
  ColorModeProvider,
  theme,
} from "@chakra-ui/core";

(async () => {
  const store = new Store();

  await store.ready();

  ReactDOM.render(
    <Provider store={store}>
      <React.StrictMode>
        <ColorModeProvider value="dark">
          <ThemeProvider
            theme={{
              ...theme,
              fonts: {
                ...theme.fonts,
                body: "'Noto Sans JP', sans-serif;",
                heading: "'Noto Sans JP', sans-serif;",
              },
              colors: {
                ...theme.colors,

                gray: {
                  ...theme.colors.gray,
                  800: "#303038",
                  900: "#272730",
                },
              },
            }}
          >
            <CSSReset></CSSReset>
            <App />
          </ThemeProvider>
        </ColorModeProvider>
      </React.StrictMode>
    </Provider>,
    document.getElementById("root")
  );
})();
