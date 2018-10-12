import React, { Component } from "react";
import { NavLink, Route } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";
import { Col, Grid, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import { memoryHistory } from "../../modules/router/history";
import colors from "../../theme/colors";
import AboutView from "../../views/AboutView";
import DownloadsView from "../../views/DownloadsView";
import PlaylistsView from "../../views/PlaylistsView";
import RequestView from "../../views/RequestView";

const Main = styled(Grid)`
  min-width: 450px;
  color: ${props => props.theme.colors.gray700};
  background-color: ${props => props.theme.colors.gray50};
`;

const Nav = styled(Row)`
  height: 48px;
  background-color: #ff5656;
  background: linear-gradient(to right, #ff5656 0%, #f4005d 100%);
`;

const Label = styled.span`
  margin-right: 5px;
`;

const Tab = styled(NavLink)`
  margin: auto;
  text-align: center;
  width: 100%;
  height: 36px;
  padding-top: 21px;
  background-color: transparent;
  border: 0;
  text-transform: lowercase;
  color: ${props => props.theme.colors.white};
  text-decoration: none;
  outline: none;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
  border-bottom: solid transparent;
  border-bottom-width: 3px;
  border-bottom-color: ${props => props.theme.colors.amber700};
  user-select: none;
  transition: all 0.3s /*  cubic-bezier(0.165, 0.84, 0.44, 1) */;
  background-color: rgba(255, 255, 255, 0);

  &.active {
    pointer-events: none;
    height: 30px;
    padding-top: 15px;
    background-color: rgba(255, 255, 255, 0.11);
  }
`;

class App extends Component {
  renderTabs() {
    return (
      <Nav middle="xs" around="xs">
        <Col xs={4}>
          <Row center="xs" middle="xs">
            <Tab exact to="/">
              <Label>{"Sniffer"}</Label>

              <span role="img" aria-label="">
                🔎
              </span>
            </Tab>
          </Row>
        </Col>
        <Col xs={4}>
          <Row center="xs" middle="xs">
            <Tab exact to="/downloads">
              <Label>{"Downloads"}</Label>

              <span role="img" aria-label="">
                🌐
              </span>
            </Tab>
          </Row>
        </Col>
        <Col xs={4}>
          <Row center="xs" middle="xs">
            <Tab exact to="/about">
              <Label>{"About"}</Label>
              <span role="img" aria-label="">
                👌
              </span>
            </Tab>
          </Row>
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
