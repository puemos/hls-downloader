import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import colors from "../../theme/colors";
import { Plus } from "../Svgs/Plus";

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

class PlaylistRow extends Component {
  render() {
    const { playlist, pos, onDownloadClick } = this.props;
    const { RESOLUTION, BANDWIDTH } = playlist.attributes;

    return (
      <StyledRow middle="xs" between="xs">
        <Col xs={10}>
          <Row>
            <Col xs={1}>{`${pos}.`}</Col>
            {BANDWIDTH && <Col xs={5}>Bandwidth: {BANDWIDTH}</Col>}
            {RESOLUTION && (
              <Col xs={6}>
                Resolution: {`${RESOLUTION.width}x${RESOLUTION.height}`}
              </Col>
            )}
          </Row>
        </Col>

        <Col>
          <DownloadButton onClick={onDownloadClick}>
            <Plus />
          </DownloadButton>
        </Col>
      </StyledRow>
    );
  }
}

export default PlaylistRow;
