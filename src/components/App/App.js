import React, { Component } from "react";
import { Route } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";
import { Col, Grid, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import { memoryHistory } from "../../modules/router/history";
import AboutView from "../../views/AboutView";
import DownloadsView from "../../views/DownloadsView";
import PlaylistsView from "../../views/PlaylistsView";
import RequestView from "../../views/RequestView";
import Tabs from "../Tabs";

const Main = styled(Grid)`
  min-width: 450px;
  color: ${props => props.theme.colors.gray700};
  background-color: ${props => props.theme.colors.gray50};
`;

class App extends Component {
  render() {
    return (
      <ConnectedRouter history={memoryHistory}>
        <Main>
          <Row>
            <Col xs={12}>
              <Row>
                <Col xs={12}>
                  <Tabs />
                </Col>
              </Row>
              <Row>
                <Route exact path="/" component={RequestView} />
                <Route exact path="/request/:id" component={PlaylistsView} />
                <Route exact path="/downloads" component={DownloadsView} />
                <Route exact path="/about" component={AboutView} />
              </Row>
            </Col>
          </Row>
        </Main>
      </ConnectedRouter>
    );
  }
}

export default App;
