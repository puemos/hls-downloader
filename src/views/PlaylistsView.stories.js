import { storiesOf } from "@storybook/react";
import React from "react";
import { injectGlobal } from "styled-components";
import Shell from "../components/App/Shell";
import PlaylistRow from "../components/PlaylistRow";
import Table from "../components/Table";
import { Body } from "./Body";

injectGlobal`
  html {
    font-weight: 300;
    font-size: 16px;
  }
  body {
    font-family: 'helvetica', sans-serif;
    margin: 0;
  }
`;

storiesOf("PlaylistView", module).add("PlaylistRow", () => (
  <Shell>
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
                  width: Math.round(320 * Math.random() * 50),
                  height: Math.round(320 * Math.random() * 10),
                },
                BANDWIDTH: 657398
              }
            }}
            onDownloadClick={() => {}}
          />
        )}
      />
    </Body>
  </Shell>
));
