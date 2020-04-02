import React from "react";
import { Store } from "webext-redux";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import App from "./components/App/App";
import { theme } from "./theme";
import { BrowserRouter } from "react-router-dom";

const store = new Store({
  portName: "HLS_DOWNLOADER" // communication port name
});

// The store implements the same interface as Redux's store
// so you can use tools like `react-redux` no problem!
render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

