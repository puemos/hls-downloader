import * as R from "ramda";
import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

const Body = styled(Col)`
  background-color: ${props => props.theme.colors.white};
  max-height: 400px;
  height: 300px;
  /* width: calc(100% - 0.5rem); */
  /* margin: 0 10px; */
`;

const NoResults = styled(Row)`
  text-align: center;
  height: 100%;
  font-size: 1rem;
  user-select: none;
`;
const Shrug = styled.div`
  font-size: 2rem;
`;

class Table extends Component {
  render() {
    const { items, renderRow } = this.props;
    const noRequets = R.isEmpty(items);
    return (
      <Body>
        {noRequets && (
          <NoResults center="xs" middle="xs">
            <div>
              <Shrug>¯\_(ツ)_/¯</Shrug>
              <div>nothing here</div>
            </div>
          </NoResults>
        )}
        {items.map(renderRow)}
      </Body>
    );
  }
}

export default Table;
