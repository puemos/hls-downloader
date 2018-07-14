import React, { Component } from "react";
import { Col, Row } from "react-styled-flexboxgrid";
import styled from "styled-components";
import elevationMixin from "../../mixin/elevation";
import colors from "../../theme/colors";

const Body = styled(Col)`
  width: 100%;
  background-color: ${colors.white};
  max-height: 400px;
  height: 300px;
  padding: 20px;
  overflow-y: scroll;
  ${elevationMixin(4)};
`;

class AboutView extends Component {
  render() {
    return (
      <Body center="xs" middle="xs">
        <Row center="xs" middle="xs" style={{ height: "100%" }}>
          <Col center="xs" middle="xs">
            <div>
              <div>
                <img
                  src="/assets/logo.png"
                  alt="hls-downloader logo"
                  style={{ width: 48, height: 48 }}
                />
              </div>
              <div>Written by: Shy Alter</div>
              <div>
                Source code:{" "}
                <a href="https://github.com/puemos/hls-downloader-chrome-extension">
                  hls-downloader-chrome-extension
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Body>
    );
  }
}

export default AboutView;
