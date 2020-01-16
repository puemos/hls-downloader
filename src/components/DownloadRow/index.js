import * as R from "ramda";
import React from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import {
  CopyButton,
  DetailsRow,
  StyledDate,
  StyledRow,
  StyledTitle,
  StyledSubTitle,
  RemoveButton
} from "../Row/elements";
import { Copy } from "../Svgs/Copy";
import { Download } from "../Svgs/Download";
import { Trashcan } from "../Svgs/Trashcan";
import { urlnameParse } from "../RequestRow/urlnameParse";

const DownloadButton = styled.a`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray500};
  outline: none;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  &:active,
  &:visited {
    color: ${props => props.theme.colors.gray500};
  }
  &:hover {
    color: ${props => props.theme.colors.gray700};
  }
`;



const Progress = styled.span`
  font-size: 0.8rem;
  text-align: right;
  font-weight: 500;
  color: ${props => props.theme.colors.blue500};
  &::after {
    font-size: 0.7rem;

    content: "%";
  }
`;

const RemoveCol = styled(Col)`
  width: 50px;
`;
const ProgressCol = styled(Col)`
  width: 50px;
  line-height: 1rem;
`;
const ActionsRow = styled(Row)`
  width: 50px;
`;

export function copyToClipboard(text) {
  const input = document.createElement("input");
  input.style.position = "fixed";
  input.style.opacity = 0;
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("Copy");
  document.body.removeChild(input);
}
function DownloadRow(props) {
  const { download, removeDownload, chromeDownload } = props;
  const progress = ((download.finished / download.total) * 100).toFixed(0);
  const date =
    new Date(download.created).toLocaleDateString() +
    " " +
    new Date(download.created).toLocaleTimeString();
  const downloadReady = progress >= 100;
  return (
    <StyledRow disable={true} center="xs" middle="xs" between="xs">
      <DetailsRow>
        <Row start="xs">
          <StyledTitle title={download.tab.title} xs={10}>
            {download.tab.title}
          </StyledTitle>
        </Row>
        <Row start="xs">
          <StyledSubTitle title={download.title} xs={10}>
            {urlnameParse(download.title)}
          </StyledSubTitle>
          <CopyButton onClick={() => copyToClipboard(download.title)}>
            <Copy></Copy>
          </CopyButton>
        </Row>
        <Row start="xs">
          <StyledDate xs={12}>{`${date}`}</StyledDate>
        </Row>
      </DetailsRow>

      <ActionsRow>
        <ProgressCol>
          <Row middle="xs" center="xs">
            <div>
              {downloadReady ? (
                <DownloadButton
                  onClick={() => {
                    chromeDownload(download);
                  }}
                >
                  <Download />
                </DownloadButton>
              ) : (
                <Progress>{progress}</Progress>
              )}
            </div>
          </Row>
        </ProgressCol>
        <RemoveCol>
          <Row middle="xs" center="xs">
            <RemoveButton onClick={() => removeDownload(download.id)}>
              <Trashcan />
            </RemoveButton>
          </Row>
        </RemoveCol>
      </ActionsRow>
    </StyledRow>
  );
}

export default DownloadRow;
