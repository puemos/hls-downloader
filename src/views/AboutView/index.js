import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import colors from "../../theme/colors";

const Body = styled(Col)`
  width: 100%;
  background-color: ${colors.white};
  max-height: 400px;
  height: 300px;
  padding: 20px;
`;
const Detail = styled.div`
  & + & {
    margin-top: 10px;
  }
`;
class AboutView extends Component {
  render() {
    return (
      <Body center="xs" middle="xs">
        <Row center="xs" middle="xs" style={{ height: "100%" }}>
          <Col center="xs" middle="xs">
            <div>
              <Detail>
                <span role="img" aria-label="">
                  🛠
                </span>{" "}
                +{" "}
                <span role="img" aria-label="">
                  💅
                </span>: Shy Alter{" "}
              </Detail>
              <Detail>
                follow me on twitter{" "}
                <a href="https://twitter.com/@puemos">@puemos</a>
              </Detail>
              <Detail>
                <a href="https://github.com/puemos/hls-downloader-chrome-extension/issues">
                  Report a bug
                </a>
              </Detail>
              <Detail>
                <a href="https://github.com/puemos/hls-downloader-chrome-extension">
                  Source code
                </a>
              </Detail>
            </div>
          </Col>
        </Row>
      </Body>
    );
  }
}

export default AboutView;
