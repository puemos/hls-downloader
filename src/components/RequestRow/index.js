import * as R from "ramda";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import colors from "../../theme/colors";
import { Expand } from "../Svgs/Expand";

const DownloadButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${colors.gray300};
  outline: none;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
`;

const StyledRow = styled(Row)`
  height: 60px;
  padding: 0 10px;
  border-bottom: 1px solid ${colors.gray200};
  color: ${colors.gray700};
  transition: background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover {
    background-color: ${colors.gray100};
    ${DownloadButton} {
      color: ${colors.gray600};
    }
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
`;

const StyledDate = styled(Col)`
  font-size: 0.6rem;
  color: ${colors.gray400};
`;

const urlnameParse = R.ifElse(
  R.pipe(
    R.length,
    R.lt(40)
  ),
  R.pipe(
    R.converge(R.concat, [
      R.take(20),
      R.pipe(
        R.takeLast(20),
        R.concat("...")
      )
    ])
  ),
  R.identity
);

class RequestRow extends Component {
  render() {
    const { request } = this.props;
    const date = new Date(request.timeStamp).toLocaleTimeString();

    return (
      <StyledLink key={request.requestId} to={`/request/${request.requestId}`}>
        <StyledRow middle="xs" between="xs">
          <Col>
            <Row>
              <Col title={request.url}>{urlnameParse(request.url)}</Col>
            </Row>
            <Row>
              <StyledDate>{date}</StyledDate>
            </Row>
          </Col>

          <Col>
            <DownloadButton>
              <Expand />
            </DownloadButton>
          </Col>
        </StyledRow>
      </StyledLink>
    );
  }
}

export default RequestRow;
