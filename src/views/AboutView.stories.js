import { storiesOf } from "@storybook/react";
import React from "react";
import { injectGlobal } from "styled-components";
import Shell from "../components/App/Shell";
import AboutView from "./AboutView";

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

storiesOf("AboutView", module).add("About", () => (
  <Shell>
    <AboutView />
  </Shell>
));
