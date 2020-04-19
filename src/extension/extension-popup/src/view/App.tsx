import { Box, Flex } from "@chakra-ui/core";
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Navbar } from "./NavbarView";
import PlaylistView from "./PlaylistView";
import SettingsView from "./SettingsView";

function App() {
  return (
    <Box
      className="App"
      bg="gray.800"
      width="500px"
      height="500px"
      overflowY="scroll"
    >
      <Router>
        <Flex direction="column">
          <Navbar></Navbar>
          <Box mb="2rem" ml="2rem" mr="1rem">
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
