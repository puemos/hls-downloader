import { Box, Flex } from "@chakra-ui/core";
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

function App() {
  return (
    <Box bg="gray.900" width="500px" height="500px">
      <Router>
        <Flex direction="column">
          <Navbar></Navbar>
          <style>
            {`
              html {
                --scrollbarBG: #272730;
                --thumbBG: #303038;
              }
              .Main::-webkit-scrollbar {
                width: 1rem;
              }
              .Main {
                scrollbar-width: thin;
                scrollbar-color: var(--thumbBG) var(--scrollbarBG);
              }
              .Main::-webkit-scrollbar-track {
                background: var(--scrollbarBG);
              }
              .Main::-webkit-scrollbar-thumb {
                background-color: var(--thumbBG) ;
                border-radius: 1rem;
                border: 5px solid var(--scrollbarBG);
              }
              `}
          </style>
          <Box overflowY="scroll" className="Main" height={500 - 72} pt="1rem">
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
