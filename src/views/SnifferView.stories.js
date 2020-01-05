import { storiesOf } from "@storybook/react";
import React from "react";
import { injectGlobal } from "styled-components";
import Shell from "../components/App/Shell";
import RequestRow from "../components/RequestRow";
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

storiesOf("SnifferView", module).add("RequestRow", () => (
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
          <RequestRow
            request={{
              timeStamp: Date.now(),
              requestId: "a",
              url:
                "https://wow.it/is.awesome.com/is.awesome.com/is.awesome.com/is.awesome.com/is.awesome.com/"
            }}
            key={idx}
          />
        )}
      />
    </Body>
  </Shell>
));
