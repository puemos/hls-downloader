import { storiesOf } from "@storybook/react";
import React from "react";
import Shell from "../components/App/Shell";
import AboutView from "./AboutView";


storiesOf("AboutView", module).add("About", () => (
  <Shell>
    <AboutView />
  </Shell>
));
