import { Router } from "react-router-dom";
import { storiesOf } from "@storybook/react";
import React from "react";
import { Col, Grid } from "react-styled-flexboxgrid";
import styled, { injectGlobal, ThemeProvider } from "styled-components";
import DownloadRow from "../src/components/DownloadRow";
import PlaylistRow from "../src/components/PlaylistRow";
import Table from "../src/components/Table";
import Tabs from "../src/components/Tabs";
import { theme } from "../src/theme";
import { memoryHistory } from "../src/modules/router/history";

const Main = styled(Grid)`
  min-width: 450px;
  width: 450px;
  color: ${props => props.theme.colors.gray700};
  background-color: ${props => props.theme.colors.white};
  border: 1px solid grey;
  height: 400px;
`;

const Body = styled(Col)`
  background-color: ${props => props.theme.colors.white};
  max-height: 400px;
  height: 300px;
`;

injectGlobal`
  html {
    font-weight: 300;
    font-size: 16px;
  }
  body {
    font-family: 'PT Sans', sans-serif;
    margin: 0;
  }
`;

storiesOf("DownloadTable", module).add("default", () => (
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
                title:
                  "https://wow.it/is.awesome.com/is.awesome.com/is.awesome.com/is.awesome.com/is.awesome.com/",
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

storiesOf("PlaylistTable", module).add("default", () => (
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
          renderRow={({ finished }, idx) => (
            <PlaylistRow
              key={idx}
              playlist={{
                attributes: {
                  RESOLUTION: {
                    width: 320,
                    height: 320
                  },
                  BANDWIDTH: 657398
                }
              }}
              onDownloadClick={() => {}}
            />
          )}
        />
      </Body>
    </Main>
  </ThemeProvider>
));

storiesOf("Tabs", module).add("default", () => (
  <ThemeProvider theme={theme}>
    <Main>
      <Router history={memoryHistory}>
        <Tabs />
      </Router>
      <Body>
        <Table
          items={[
            { finished: 22 },
            { finished: 4 },
            { finished: 45 },
            { finished: 100 }
          ]}
          renderRow={({ finished }, idx) => (
            <PlaylistRow
              key={idx}
              playlist={{
                attributes: {
                  RESOLUTION: {
                    width: 320,
                    height: 320
                  },
                  BANDWIDTH: 657398
                }
              }}
              onDownloadClick={() => {}}
            />
          )}
        />
      </Body>
    </Main>
  </ThemeProvider>
));
