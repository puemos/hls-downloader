import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import AboutView from "./AboutView";

const meta: Meta<typeof AboutView> = {
  title: "popup/views/AboutView",
  component: AboutView,
};

export default meta;
type Story = StoryObj<typeof AboutView>;

export const Primary: Story = {
  render: () => (
    <AboutView
      version="1.0.0"
      name="HLS Downloader"
      description="HTTP Live Stream downloader"
    />
  ),
};

export const CustomDescription: Story = {
  render: () => (
    <AboutView
      version="2.3.4"
      name="HLS Downloader"
      description="A handy browser extension for saving HLS streams with ease."
    />
  ),
};
