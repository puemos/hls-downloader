import React from "react";
import { configure, addDecorator } from "@storybook/react";
import { theme } from "../src/theme";
import styled, { ThemeProvider } from "styled-components";
import { Main } from "../src/components/App/Main";
import { MemoryRouter } from "react-router";

const StoryMain = styled(Main)`
  max-width: 450px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  height: 400px;
`;

addDecorator(storyFn => (
  <ThemeProvider theme={theme}>
    <MemoryRouter>
      <StoryMain>{storyFn()}</StoryMain>
    </MemoryRouter>
  </ThemeProvider>
));

// automatically import all files ending in *.stories.js
const req = require.context("../src", true, /\.stories\.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
