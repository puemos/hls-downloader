import { Box, Flex } from "@chakra-ui/react";
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import { Navbar } from "./NavbarView";
import PlaylistsView from "./PlaylistsView";
import SettingsView from "./SettingsView";
import AboutView from "./AboutView";
import DownloadsView from "./DownloadsView";
import DirectUrlView from "./DirectUrlView";

function App() {
  return (
    <Box bg="gray.900" width="500px" height="500px">
      <Router>
        <Flex direction="column">
          <Navbar></Navbar>
          <Box
            overflowY="scroll"
            className="Main"
            height={500 - 72}
            pt="1rem"
            css={{
              "&::-webkit-scrollbar": {
                width: "1rem",
              },
              "&": {
                "scrollbar-width": "thin",
                "scrollbar-color": "#303038 var(--chakra-colors-gray-900)",
              },
              "&::-webkit-scrollbar-track": {
                background: "var(--chakra-colors-gray-900)",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#303038",
                borderRadius: "1rem",
                border: "5px solid var(--chakra-colors-gray-900)",
              },
            }}
          >
            <Switch>
              <Redirect from="/index.html" to="/" />
              <Route path="/settings">
                <SettingsView />
              </Route>
              <Route path="/downloads">
                <DownloadsView />
              </Route>
              <Route path="/about">
                <AboutView />
              </Route>
              <Route path="/direct">
                <DirectUrlView />
              </Route>
              <Route path="/">
                <PlaylistsView />
              </Route>
            </Switch>
          </Box>
        </Flex>
      </Router>
    </Box>
  );
}
export default App;
