import React, { Component } from "react";
import { NavLink, Route } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";
import { Col, Grid, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import { memoryHistory } from "../../modules/router/history";
import colors from "../../theme/colors";
import AboutView from "../AboutView";
import DownloadsView from "../DownloadsView";
import RequestListView from "../RequestListView";
import RequestView from "../RequestView";

const Main = styled(Grid)`
  min-width: 450px;
  color: ${colors.gray700};
  background-color: ${colors.gray50};
`;

const Nav = styled(Row)`
  height: 60px;
  background-color: #ff5656;
  background: linear-gradient(to right, #ff5656 0%, #f4005d 100%);
`;

const Tab = styled(NavLink)`
  width: 100%;
  height: 60px;
  background-color: transparent;
  border: 0;
  text-transform: uppercase;
  color: ${colors.white};
  text-decoration: none;
  outline: none;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
  border-bottom: 1px solid transparent;
  user-select: none;
  transition: border-bottom-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  &:hover {
    border-bottom-color: ${colors.white};
  }
  &.active {
    pointer-events: none;
    border-bottom-color: ${colors.white};
  }
`;

class App extends Component {
  renderTabs() {
    return (
      <Nav middle="xs" around="xs">
        <Col>
          <Tab exact to="/">
            Sniffer
          </Tab>
        </Col>
        <Col>
          <Tab exact to="/downloads">
            Downloads
          </Tab>
        </Col>
        <Col>
          <Tab exact to="/about">
            About
          </Tab>
        </Col>
      </Nav>
    );
  }
  render() {
    return (
      <ConnectedRouter history={memoryHistory}>
        <Main>
          <Row>
            <Col xs={12}>
              <Row>
                <Col xs={12}>{this.renderTabs()}</Col>
              </Row>
              <Row>
                <Route exact path="/" component={RequestListView} />
                <Route exact path="/request/:id" component={RequestView} />
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
