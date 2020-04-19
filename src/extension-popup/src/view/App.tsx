import { Box, Flex } from "@chakra-ui/core";
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Navbar } from "./NavbarView";
import PlaylistView from "./PlaylistView";
import SettingsView from "./SettingsView";

function App() {
  return (
    <Box bg="gray.800">
      <Router>
        <Flex direction="column">
          <Navbar></Navbar>
          <Box m="2rem">
            <Switch>
              <Route path="/settings">
                <SettingsView></SettingsView>
              </Route>
              <Route path="/">
                <PlaylistView />
              </Route>
            </Switch>
          </Box>
        </Flex>
      </Router>
    </Box>
  );
}
export default App;
