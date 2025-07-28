import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "ui/Separator",
  component: Separator,
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  render: () => (
    <div className="space-y-2">
      <div>Above</div>
      <Separator />
      <div>Below</div>
    </div>
  ),
};
