import React from "react";
import { storiesOf } from "@storybook/react";
import DownloadRow from "../src/components/DownloadRow";

storiesOf("DownloadRow", module).add("default", () => (
  <DownloadRow
    download={{
      finished: 23,
      total: 100,
      created: new Date(),
      title: "",
      id: "",
      link: ""
    }}
  />
));
