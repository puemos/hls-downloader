import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "ui/Progress",
  component: Progress,
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const FiftyPercent: Story = {
  render: () => <Progress value={50} className="w-full" />,
};
