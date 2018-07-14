import { Circle } from "rc-progress";
import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import colors from "../../theme/colors";
import { Download } from "../Svgs/Download";
import { Trashcan } from "../Svgs/Trashcan";

const DownloadButton = styled.a`
  background-color: transparent;
  border: 0;
  color: ${colors.gray300};
  outline: none;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  &:active,
  &:visited {
    color: ${colors.gray300};
  }
`;

const RemoveButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${colors.gray300};
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  outline: none;
  cursor: pointer;
`;

const StyledRow = styled(Row)`
  height: 60px;
  padding: 0 10px;
  border-bottom: 1px solid ${colors.gray200};
  color: ${colors.gray700};
  transition: background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover {
    background-color: ${colors.gray100};
    ${RemoveButton}, ${DownloadButton} {
      color: ${colors.gray600};
    }
  }
`;

const StyledTitle = styled(Col)`
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: left;
`;
// function parseCreation(download) {
//   const time = new Date(download.created);
//   return `${time.toLocaleTimeString()}`;
// }

class DownloadRow extends Component {
  render() {
    const { download, pos, removeDownload } = this.props;
    const progress = download.finished / download.total * 100;
    return (
      <StyledRow center="xs" middle="xs" between="xs" progress={progress}>
        <Col xs={10}>
          <Row>
            <Col xs={1}>{`${pos}.`}</Col>
            <StyledTitle xs={10}>{download.title}</StyledTitle>
          </Row>
        </Col>

        <Col>
          <Row middle="xs" center="xs">
            <RemoveButton onClick={() => removeDownload(download.id)}>
              <Trashcan />
            </RemoveButton>
          </Row>
        </Col>
        <Col>
          <Row middle="xs" center="xs">
            <div style={{ width: 16, height: 16 }}>
              {progress === 100 ? (
                <DownloadButton
                  href={download.link}
                  download={`${download.title}.mp4`}
                >
                  <Download />
                </DownloadButton>
              ) : (
                <Circle
                  percent={progress}
                  strokeWidth="10"
                  strokeColor={colors.gray600}
                />
              )}
            </div>
          </Row>
        </Col>
      </StyledRow>
    );
  }
}

export default DownloadRow;
