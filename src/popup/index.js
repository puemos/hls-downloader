import React from "react";
import { Store } from "react-chrome-redux";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { injectGlobal, ThemeProvider } from "styled-components";
import App from "../components/App/App";
import { theme } from "../theme";

const store = new Store({
  portName: "HLS_DOWNLOADER" // communication port name
});

// The store implements the same interface as Redux's store
// so you can use tools like `react-redux` no problem!
render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

injectGlobal`
  html {
    font-weight: 400;
    font-size: 16px;
  }
  body {
    font-family: 'helvetica', sans-serif;
    margin: 0;
  }
`;
