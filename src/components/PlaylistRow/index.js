import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import colors from "../../theme/colors";
import { Plus } from "../Svgs/Plus";

const DownloadButton = styled.button`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray300};
  outline: none;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
`;

const StyledRow = styled(Row)`
  height: 60px;
  padding: 0 10px;
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
  color: ${props => props.theme.colors.gray700};
  transition: background-color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover {
    background-color: ${props => props.theme.colors.gray100};
    ${DownloadButton} {
      color: ${props => props.theme.colors.gray600};
    }
  }
`;

const Detail = styled.span`
  font-size: 0.6rem;
  color: ${props => props.theme.colors.gray500};
`;

class PlaylistRow extends Component {
  render() {
    const { playlist, onDownloadClick } = this.props;
    const { RESOLUTION, BANDWIDTH } = playlist.attributes;

    return (
      <StyledRow middle="xs" between="xs">
        <Col xs={10}>
          <Row>
            {BANDWIDTH && (
              <Col>
                Bandwidth: <Detail>{BANDWIDTH}</Detail>
              </Col>
            )}
            {RESOLUTION && (
              <Col>
                Resolution:{" "}
                <Detail>{`${RESOLUTION.width}x${RESOLUTION.height}`}</Detail>
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
