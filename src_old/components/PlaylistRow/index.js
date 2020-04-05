import React from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import { MoreButton, StyledRow } from "../Row/elements";
import { RightArrow } from "../Svgs/RightArrow";

const DownloadButton = styled.div`
  background-color: transparent;
  border: 0;
  color: ${props => props.theme.colors.gray300};
  outline: none;
  cursor: pointer;
  transition: color 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  &:hover {
    color: ${props => props.theme.colors.gray500};
  }
`;

const DetailLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;

  color: ${props => props.theme.colors.gray800};
`;

const DetailValue = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${props => props.theme.colors.gray500};
  margin-right: 5px;
`;

function PlaylistRow(props) {
  const { playlist, onClick } = props;
  const { RESOLUTION, BANDWIDTH } = playlist.attributes;

  return (
    <StyledRow middle="xs" between="xs" onClick={onClick}>
      <Col xs={10}>
        <Row>
          {RESOLUTION && (
            <Col>
              <DetailLabel>Resolution:</DetailLabel>{" "}
              <DetailValue>{`${RESOLUTION.width}x${RESOLUTION.height}`}</DetailValue>
            </Col>
          )}
          {BANDWIDTH && (
            <>
              <div style={{ width: 15 }}></div>
              <Col>
                <DetailLabel>Bandwidth:</DetailLabel>{" "}
                <DetailValue>{BANDWIDTH}</DetailValue>
              </Col>
            </>
          )}
        </Row>
      </Col>

      <Col>
        <DownloadButton>
          <MoreButton>
            <RightArrow />
          </MoreButton>
        </DownloadButton>
      </Col>
    </StyledRow>
  );
}

export default PlaylistRow;
