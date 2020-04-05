import React from "react";
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
  text-align: center;
  & + & {
    margin-top: 10px;
  }
`;
const DetailValue = styled.span`
  color: ${props => props.theme.colors.blue500};
`;
const Co = styled.div`
  color: ${props => props.theme.colors.gray600};
  font-size: 0.8rem;
  text-align: center;
`;
const DetailLink = styled.a`
  color: ${props => props.theme.colors.blue500};

  &:active,
  &:visited {
    color: ${props => props.theme.colors.blue500};
  }
`;
const DetailButton = styled.a`
  color: ${props => props.theme.colors.gray600};
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
    color: ${props => props.theme.colors.gray600};
  }
  &:hover {
    color: ${props => props.theme.colors.gray600};
  }
`;
function AboutView() {
  return (
    <Body center="xs" middle="xs">
      <Row center="xs" middle="xs" style={{ height: "100%" }}>
        <Col center="xs" start="xs">
          <Detail>
            Made with{" "}
            <span role="img" style={{ color: "red" }}>
              ❤
            </span>{" "}
            by <DetailValue>Shy Alter</DetailValue>
          </Detail>
          <Detail>
            Follow me on twitter{" "}
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
      <Co>
        This extension is completely free and published under the MIT license.
        However, if you are using it and enjoy it, you are welcome to making{" "}
        <a
          target="blank"
          href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=9KTFNHLYAJ5EE&source=url"
        >
          a donation of
        </a>{" "}
        your choice.
      </Co>
    </Body>
  );
}

export default AboutView;
