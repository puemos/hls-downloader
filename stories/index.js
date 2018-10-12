import React from "react";
import { storiesOf } from "@storybook/react";
import DownloadRow from "../src/components/DownloadRow";
import Table from "../src/components/Table";
import styled, { injectGlobal } from "styled-components";
import { Col, Grid } from "react-styled-flexboxgrid";
import { ThemeProvider } from "styled-components";
import { theme } from "../src/theme";

const Main = styled(Grid)`
  min-width: 450px;
  width: 450px;
  color: ${props => props.theme.colors.gray700};
  background-color: ${props => props.theme.colors.gray50};
`;

const Body = styled(Col)`
  background-color: ${props => props.theme.colors.white};
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

injectGlobal`
  html {
    font-weight: 400;
    font-size: 16px;
  }
  body {
    font-family: 'PT Sans', sans-serif;
    margin: 0;
  }
`;

storiesOf("DownloadRow", module).add("default", () => (
  <ThemeProvider theme={theme}>
    <Main>
      <Body>
        <Table
          items={[
            { finished: 22 },
            { finished: 4 },
            { finished: 45 },
            { finished: 100 }
          ]}
          renderRow={({ finished }) => (
            <DownloadRow
              download={{
                finished,
                total: 100,
                created: new Date(),
                title: "https://wow.it/is.awesome.com/is.awesome.com/is.awesome.com/is.awesome.com/is.awesome.com/",
                id: 23,
                link: "https://wow.it/is.awesome.com"
              }}
            />
          )}
        />
      </Body>
    </Main>
  </ThemeProvider>
));
