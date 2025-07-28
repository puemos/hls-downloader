import type { Meta, StoryObj } from "@storybook/react";
import RouterView from "./RouterView";
import { RouterContext } from "./RouterContext";
import { TabOptions } from "./types";

const meta: Meta<typeof RouterView> = {
  title: "popup/views/RouterView",
  component: RouterView,
};

export default meta;
type Story = StoryObj<typeof RouterView>;

export const Default: Story = {
  render: () => (
    <RouterContext.Provider
      value={{ tab: TabOptions.SNIFTER, setTab: () => {} }}
    >
      <RouterView />
    </RouterContext.Provider>
  ),
};

export const DownloadsTab: Story = {
  render: () => (
    <RouterContext.Provider
      value={{ tab: TabOptions.DOWNLOADS, setTab: () => {} }}
    >
      <RouterView />
    </RouterContext.Provider>
  ),
};

export const SettingsTab: Story = {
  render: () => (
    <RouterContext.Provider
      value={{ tab: TabOptions.SETTINGS, setTab: () => {} }}
    >
      <RouterView />
    </RouterContext.Provider>
  ),
};
