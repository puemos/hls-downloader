import * as R from "ramda";
import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

const Body = styled(Col)`
  max-height: 400px;
  height: 350px;
  overflow-y: scroll;
  /* width: calc(100% - 0.5rem); */
  /* margin: 0 10px; */
`;

const NoResults = styled(Row)`
  text-align: center;
  height: 100%;
  user-select: none;
`;
const Looking = styled.img`
  width: 350px;
`;
const EmptyMsg = styled.div`
  color: ${props => props.theme.colors.gray600};
  margin-top: 0.5rem;
  font-size: 0.8rem;
`;
class Table extends Component {
  render() {
    const { items, renderRow, emptyMsg } = this.props;
    const noRequets = R.isEmpty(items);
    return (
      <Body>
        {noRequets && (
          <NoResults center="xs" middle="xs">
            <div>
              <Looking src="/assets/looking.gif" alt="" />
              <EmptyMsg>{emptyMsg}</EmptyMsg>
            </div>
          </NoResults>
        )}
        {items.map(renderRow)}
      </Body>
    );
  }
}

export default Table;
