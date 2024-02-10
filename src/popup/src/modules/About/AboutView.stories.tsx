import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import AboutView from "./AboutView";

const meta: Meta<typeof AboutView> = {
  title: "AboutView",
  component: AboutView,
};

export default meta;
type Story = StoryObj<typeof AboutView>;

export const Primary: Story = {
  render: () => <AboutView version="1.0.0" />,
};
