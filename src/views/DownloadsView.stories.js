import { storiesOf } from "@storybook/react";
import React from "react";
import { injectGlobal } from "styled-components";
import Shell from "../components/App/Shell";
import DownloadRow from "../components/DownloadRow";
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

storiesOf("DownloadView", module).add("DownloadRow", () => (
  <Shell>
    <Body>
      <Table
        items={[
          {
            title: "https://www.example.com/approval",
            finished: 22,
            created: new Date(2018, 3, 12, 12, 34, 47)
          },
          {
            title: "https://berry.example.org/achiever/bath.php",
            finished: 4,
            created: new Date(2018, 3, 12, 11, 3, 7)
          },
          {
            title: "http://www.example.org/acoustics?boundary=brake",
            finished: 45,
            created: new Date(2018, 3, 11, 2, 42, 1)
          },
          {
            title:
              "https://www.example.com/bait.php?bedroom=book&breath=bottle",
            finished: 100,
            created: new Date(2018, 2, 1, 1, 4, 7)
          }
        ]}
        renderRow={({ finished, title, created }) => (
          <DownloadRow
            download={{
              finished,
              total: 100,
              created,
              title,
              id: 23,
              link: "https://wow.it/is.awesome.com"
            }}
          />
        )}
      />
    </Body>
  </Shell>
));
