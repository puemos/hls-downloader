import { storiesOf } from "@storybook/react";
import React from "react";
import Shell from "../components/App/Shell";
import Table from "../components/Table";
import { Body } from "./Body";


storiesOf("EmptyView", module).add("EmptyRow", () => (
  <Shell>
    <Body>
      <Table emptyMsg="Sorry, i wasn't able to find any HTTP Live Streams" items={[]} renderRow={() => <div></div>} />
    </Body>
  </Shell>
));
