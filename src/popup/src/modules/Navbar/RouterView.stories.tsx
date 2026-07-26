import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "@hls-downloader/core/lib/store/root-reducer";
import { userEvent, within } from "storybook/test";
import RouterView from "./RouterView";
import { RouterContext } from "./RouterContext";
import { TabOptions } from "./types";

const meta: Meta<typeof RouterView> = {
  title: "popup/views/RouterView",
  component: RouterView,
};

export default meta;
type Story = StoryObj<typeof RouterView>;

const InteractiveExtensionView = ({
  initialTab = TabOptions.SNIFTER,
  dark = false,
}: {
  initialTab?: TabOptions;
  dark?: boolean;
}) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <div
      className={
        dark
          ? "dark h-full bg-background text-foreground"
          : "h-full bg-background text-foreground"
      }
    >
      <RouterContext.Provider
        value={{ tab, setTab: (nextTab) => setTab(nextTab as TabOptions) }}
      >
        <RouterView />
      </RouterContext.Provider>
    </div>
  );
};

const EmptyExtensionView = ({
  initialTab = TabOptions.SNIFTER,
}: {
  initialTab?: TabOptions;
}) => {
  const [store] = useState(() =>
    configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
    }),
  );

  return (
    <Provider store={store}>
      <InteractiveExtensionView initialTab={initialTab} />
    </Provider>
  );
};

export const InteractiveExtension: Story = {
  render: () => <InteractiveExtensionView />,
};

export const EmptyCapture: Story = {
  render: () => <EmptyExtensionView />,
};

export const EmptyDownloads: Story = {
  render: () => <EmptyExtensionView initialTab={TabOptions.DOWNLOADS} />,
};

export const Default: Story = {
  render: () => <InteractiveExtensionView />,
};

export const DownloadsTab: Story = {
  render: () => <InteractiveExtensionView initialTab={TabOptions.DOWNLOADS} />,
};

export const SettingsTab: Story = {
  render: () => <InteractiveExtensionView initialTab={TabOptions.SETTINGS} />,
};

export const AboutTab: Story = {
  render: () => <InteractiveExtensionView initialTab={TabOptions.ABOUT} />,
};

export const DarkCapture: Story = {
  render: () => <InteractiveExtensionView dark />,
};

export const DarkDownloads: Story = {
  render: () => (
    <InteractiveExtensionView initialTab={TabOptions.DOWNLOADS} dark />
  ),
};

export const DarkSettings: Story = {
  render: () => (
    <InteractiveExtensionView initialTab={TabOptions.SETTINGS} dark />
  ),
};

export const DarkAbout: Story = {
  render: () => <InteractiveExtensionView initialTab={TabOptions.ABOUT} dark />,
};

export const StreamDetail: Story = {
  render: () => <InteractiveExtensionView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Choose quality for Storybook playlist",
      }),
    );
  },
};

export const DarkStreamDetail: Story = {
  render: () => <InteractiveExtensionView dark />,
  play: StreamDetail.play,
};

export const StreamPreview: Story = {
  render: () => <InteractiveExtensionView />,
  play: async (context) => {
    await StreamDetail.play?.(context);
    const canvas = within(context.canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open stream preview" }),
    );
  },
};

export const DownloadDetail: Story = {
  render: () => <InteractiveExtensionView initialTab={TabOptions.DOWNLOADS} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Open details for Example video.mp4",
      }),
    );
  },
};

export const DarkDownloadDetail: Story = {
  render: () => (
    <InteractiveExtensionView initialTab={TabOptions.DOWNLOADS} dark />
  ),
  play: DownloadDetail.play,
};

export const StorageDetails: Story = {
  render: () => <InteractiveExtensionView initialTab={TabOptions.DOWNLOADS} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Storage details" }),
    );
  },
};

export const DarkStorageDetails: Story = {
  render: () => (
    <InteractiveExtensionView initialTab={TabOptions.DOWNLOADS} dark />
  ),
  play: StorageDetails.play,
};
