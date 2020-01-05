import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

const Nav = styled(Row)`
  /* height: 32px; */
  padding: 16px 0;
  background-color: ${props => props.theme.colors.header};
`;

const Label = styled.span``;

const Tab = styled(NavLink)`
  margin: auto;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: capitalize;
  height: 100%;
  color: ${props => props.theme.colors.gray400};
  text-decoration: none;
  outline: none;
  cursor: pointer;
  width: 33%;
  user-select: none;
  transition: all 0.3s /*  cubic-bezier(0.165, 0.84, 0.44, 1) */;
  & + & {
    border-left: 0;
  }
  &.active {
    color: ${props => props.theme.colors.primary};
  }
`;

class Tabs extends Component {
  render() {
    return (
      <Nav middle="xs" around="xs">
        <Tab exact to="/sniffer">
          <div>
            <Label>{"Sniffer"}</Label>
          </div>
        </Tab>
        <Tab exact to="/downloads">
          <div>
            <Label>{"Downloads"}</Label>
          </div>
        </Tab>
        <Tab exact to="/about">
          <div>
            <Label>{"About"}</Label>
          </div>
        </Tab>
      </Nav>
    );
  }
}

export default Tabs;
