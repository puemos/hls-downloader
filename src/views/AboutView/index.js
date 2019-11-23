import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";

const Body = styled(Col)`
  width: 100%;
  max-height: 400px;
  height: 300px;
  padding: 20px;
`;
const ActionsRow = styled(Row)`
  margin-top: 3rem;
`;
const Detail = styled.div`
  text-align: left;
  & + & {
    margin-top: 10px;
  }
`;
const DetailValue = styled.span`
  color: ${props => props.theme.colors.blue500};
`;
const DetailLink = styled.a`
  color: ${props => props.theme.colors.blue500};

  &:active,
  &:visited {
    color: ${props => props.theme.colors.blue500};
  }
`;
const DetailButton = styled.a`
  background-color: ${props => props.theme.colors.blue500};
  color: ${props => props.theme.colors.white};
  text-decoration: none;
  border-radius: 10px;
  padding: 5px 10px;
  font-size: 0.8rem;
  & + & {
    margin-left: 10px;
  }
  &:active,
  &:visited {
    text-decoration: none;
    color: ${props => props.theme.colors.white};
  }
  &:hover {
    background-color: ${props => props.theme.colors.blue400};
  }
`;
class AboutView extends Component {
  render() {
    return (
      <Body center="xs" middle="xs">
        <Row center="xs" middle="xs" style={{ height: "100%" }}>
          <Col center="xs" start="xs">
            <Detail>
              made with <span role="img">❤</span> by:{" "}
              <DetailValue>Shy Alter</DetailValue>
            </Detail>
            <Detail>
              follow me on twitter:{" "}
              <DetailLink target="blank" href="https://twitter.com/@puemos">
                @puemos
              </DetailLink>
            </Detail>
            <ActionsRow>
              <DetailButton
                target="blank"
                href="https://github.com/puemos/hls-downloader-chrome-extension/issues"
              >
                Report a bug
              </DetailButton>
              <DetailButton
                target="blank"
                href="https://github.com/puemos/hls-downloader-chrome-extension"
              >
                Source code
              </DetailButton>
            </ActionsRow>
          </Col>
        </Row>
      </Body>
    );
  }
}

export default AboutView;
