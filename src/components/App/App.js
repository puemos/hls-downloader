import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from "react-router-dom";
import { Col, Row } from "react-styled-flexboxgrid";
import AboutView from "../../views/AboutView";
import DownloadsView from "../../views/DownloadsView";
import PlaylistsView from "../../views/PlaylistsView";
import SnifferView from "../../views/SnifferView";
import Tabs from "../Tabs";
import { Main } from "./Main";

function App() {
  return (
    <Router>
      <Main>
        <Row>
          <Col xs={12}>
            <Row>
              <Col xs={12}>
                <Tabs />
              </Col>
            </Row>
            <Row>
              <Switch>
                <Redirect from="/index.html" to="/sniffer" />
                <Route exact path="/sniffer" component={SnifferView} />
                <Route exact path="/request/:id" component={PlaylistsView} />
                <Route exact path="/downloads" component={DownloadsView} />
                <Route exact path="/about" component={AboutView} />
              </Switch>
            </Row>
          </Col>
        </Row>
      </Main>
    </Router>
  );
}

export default App;
