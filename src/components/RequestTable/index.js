import * as R from "ramda";
import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import elevationMixin from "../../mixin/elevation";
import colors from "../../theme/colors";
import RequestRow from "./RequestRow";

const RequestBody = styled(Col)`
  width: 100%;
  background-color: ${colors.white};
  max-height: 400px;
  height: 300px;

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

class RequestTable extends Component {
  render() {
    const { requests } = this.props;
    const noRequets = R.isEmpty(requests);
    return (
      <RequestBody>
        {noRequets && (
          <Shrugging center="xs" middle="xs">
            <span>¯\_(ツ)_/¯</span>
          </Shrugging>
        )}
        {requests.map((r, idx) => (
          <RequestRow pos={idx + 1} key={r.requestId} request={r} />
        ))}
      </RequestBody>
    );
  }
}

export default RequestTable;
