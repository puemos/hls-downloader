import React from "react";
import { Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import { copyToClipboard } from "../DownloadRow";
import { CopyButton, DetailsRow, MoreButton, StyledDate, StyledRow, StyledSubTitle, StyledTitle } from "../Row/elements";
import { RightArrow } from "../Svgs/RightArrow";
import { urlnameParse } from "./urlnameParse";

const MoreAction = styled.div`
  text-decoration: none;
`;

function RequestRow(props) {
  const { request, tab, onClick } = props;
  const date =
    new Date(request.timeStamp).toLocaleDateString() +
    " " +
    new Date(request.timeStamp).toLocaleTimeString();

  return (
    <StyledRow middle="xs" between="xs" onClick={onClick}>
      <DetailsRow>
        <Row start="xs">
          <StyledTitle title={tab.title} xs={10}>
            {tab.title}
          </StyledTitle>
        </Row>
        <Row start="xs">
          <StyledSubTitle title={request.url} xs={10}>
            {urlnameParse(request.url)}
          </StyledSubTitle>
          <CopyButton onClick={() => copyToClipboard(request.url)}>
          copy
          </CopyButton>
        </Row>
        <Row start="xs">
          <StyledDate xs={12}>{`${date}`}</StyledDate>
        </Row>
      </DetailsRow>
      <MoreAction>
        <MoreButton>
          <RightArrow />
        </MoreButton>
      </MoreAction>
    </StyledRow>
  );
}

export default RequestRow;
