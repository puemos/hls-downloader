import { Box, Flex } from "@chakra-ui/core";
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Navbar } from "./NavbarView";
import PlaylistsView from "./PlaylistsView";
import SettingsView from "./SettingsView";

function App() {
  return (
    <Box bg="gray.800" width="500px" height="500px">
      <Router>
        <Flex direction="column">
          <Navbar></Navbar>
          <style>
            {`
              html {
                --scrollbarBG: #1A202C;
                --thumbBG: #2c323d;
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
          <Box
            overflowY="scroll"
            className="Main"
            height={500 - 72}
            pl="2rem"
            pr="1rem"
            pb="2rem"
          >
            <Switch>
              <Route path="/settings">
                <SettingsView></SettingsView>
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
