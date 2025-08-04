import type { Meta, StoryObj } from "@storybook/react";
import { Metadata } from "./Metadata";

const meta: Meta<typeof Metadata> = {
  title: "popup/Metadata",
  component: Metadata,
};

export default meta;
type Story = StoryObj<typeof Metadata>;

export const Default: Story = {
  render: () => (
    <Metadata
      metadata={{
        type: "stream",
        width: 1920,
        height: 1080,
        bitrate: 4000000,
        fps: 30,
      }}
    />
  ),
};
