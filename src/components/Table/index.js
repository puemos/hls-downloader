import * as R from "ramda";
import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import elevationMixin from "../../mixin/elevation";
import colors from "../../theme/colors";

const Body = styled(Col)`
  background-color: ${colors.white};
  max-height: 400px;
  height: 300px;
  /* width: calc(100% - 0.5rem); */
  width: 100%;
  overflow-y: scroll;
  ${elevationMixin(4)};
`;

const Shrugging = styled(Row)`
  width: 100%;
  text-align: center;
  height: 100%;
  font-size: 2rem;
  user-select: none;
`;

class Table extends Component {
  render() {
    const { items, renderRow } = this.props;
    const noRequets = R.isEmpty(items);
    return (
      <Body>
        {noRequets && (
          <Shrugging center="xs" middle="xs">
            <span>¯\_(ツ)_/¯</span>
          </Shrugging>
        )}
        {items.map(renderRow)}
      </Body>
    );
  }
}

export default Table;
