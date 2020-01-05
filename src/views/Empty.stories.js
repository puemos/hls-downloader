import { storiesOf } from "@storybook/react";
import React from "react";
import { injectGlobal } from "styled-components";
import Shell from "../components/App/Shell";
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

storiesOf("EmptyView", module).add("EmptyRow", () => (
  <Shell>
    <Body>
      <Table emptyMsg="Sorry, i wasn't able to find any HTTP Live Streams" items={[]} renderRow={() => <div></div>} />
    </Body>
  </Shell>
));
