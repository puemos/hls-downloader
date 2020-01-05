import * as R from "ramda";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import { copyToClipboard } from "../DownloadRow";
import {
  CopyButton,
  DetailsRow,
  StyledDate,
  StyledRow,
  StyledTitle,
  MoreButton
} from "../Row/elements";
import { RightArrow } from "../Svgs/RightArrow";
import { Copy } from "../Svgs/Copy";

const MoreAction = styled(Link)`
  text-decoration: none;
`;

const urlnameParse = R.ifElse(
  R.pipe(R.length, R.lt(40)),
  R.pipe(
    R.converge(R.concat, [R.take(20), R.pipe(R.takeLast(20), R.concat("..."))])
  ),
  R.identity
);

class RequestRow extends Component {
  render() {
    const { request } = this.props;
    const date =
      new Date(request.timeStamp).toLocaleDateString() +
      " " +
      new Date(request.timeStamp).toLocaleTimeString();

    return (
      <StyledRow middle="xs" between="xs">
        <DetailsRow>
          <Row start="xs">
            <StyledTitle title={request.url} xs={10}>
              {urlnameParse(request.url)}
            </StyledTitle>
            <CopyButton onClick={() => copyToClipboard(request.url)}>
              <Copy></Copy>
            </CopyButton>
          </Row>
          <Row start="xs">
            <StyledDate xs={12}>{`${date}`}</StyledDate>
          </Row>
        </DetailsRow>
        <MoreAction to={`/request/${request.requestId}`}>
          <MoreButton>
            <RightArrow />
          </MoreButton>
        </MoreAction>
      </StyledRow>
    );
  }
}

export default RequestRow;
