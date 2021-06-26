import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Store } from "webext-redux";
import App from "./view/App";
import { ColorModeScript, ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";

(async () => {
  const store = new Store();

  await store.ready();

  ReactDOM.render(
    <Provider store={store}>
      <React.StrictMode>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ChakraProvider theme={theme}>
          <App />
        </ChakraProvider>
      </React.StrictMode>
    </Provider>,
    document.getElementById("root")
  );
})();
