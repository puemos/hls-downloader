import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

const Nav = styled(Row)`
  height: 32px;
  line-height: 32px;
  /* background-color: #ff5656; */
  /* background: linear-gradient(to right, #ff5656 0%, #f4005d 100%); */
  margin: 5px;
  border-top-left-radius: 15px;
  border-bottom-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-right-radius: 15px;
`;

const Label = styled.span`
  margin-right: 5px;
`;

const Tab = styled(NavLink)`
  margin: auto;
  text-align: center;
  font-weight: 300;

  height: 100%;
  text-transform: lowercase;
  color: ${props => props.theme.colors.blue500};
  text-decoration: none;
  outline: none;
  cursor: pointer;
  width: 33%;
  user-select: none;
  transition: all 0.3s /*  cubic-bezier(0.165, 0.84, 0.44, 1) */;
  background-color: rgba(255, 255, 255, 0);
  border-left: 1px solid ${props => props.theme.colors.blue500};
  border-right: 1px solid ${props => props.theme.colors.blue500};
  border-bottom: 1px solid ${props => props.theme.colors.blue500};
  border-top: 1px solid ${props => props.theme.colors.blue500};
  & + & {
    border-left: 0;
  }
  &.active {
    color: ${props => props.theme.colors.white};
    background-color: ${props => props.theme.colors.blue500};
  }
  &:first-child {
    border-top-left-radius: 15px;
    border-bottom-left-radius: 15px;
  }
  &:last-child {
    border-top-right-radius: 15px;
    border-bottom-right-radius: 15px;
  }
`;

class Tabs extends Component {
  render() {
    return (
      <Nav middle="xs" around="xs">
        <Tab exact to="/">
          <Label>{"Sniffer"}</Label>
        </Tab>
        <Tab exact to="/downloads">
          <Label>{"Downloads"}</Label>
        </Tab>
        <Tab exact to="/about">
          <Label>{"About"}</Label>
        </Tab>
      </Nav>
    );
  }
}

export default Tabs;
