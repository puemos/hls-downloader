import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Job } from "@hls-downloader/core/lib/entities";
import { initialStorageState } from "@hls-downloader/core/lib/store/slices";
import DownloadsView from "./DownloadsView";

const meta: Meta<typeof DownloadsView> = {
  title: "popup/views/DownloadsView",
  component: DownloadsView,
};

export default meta;
type Story = StoryObj<typeof DownloadsView>;

const sampleJobs = [
  new Job("1", undefined, [], [], "video1.mp4", Date.now()),
  new Job("2", undefined, [], [], "video2.mp4", Date.now()),
];

const commonProps = {
  filter: "",
  setCurrentJobId: () => {},
  setFilter: () => {},
  storage: initialStorageState,
  onCleanup: () => {},
  onRefreshStorage: () => {},
};

export const Empty: Story = {
  render: () => (
    <DownloadsView
      {...commonProps}
      jobs={[]}
      hasJobs={false}
      showFilterInput={false}
      currentJobId={undefined}
    />
  ),
};

export const WithJobs: Story = {
  render: () => (
    <DownloadsView
      {...commonProps}
      jobs={sampleJobs}
      hasJobs
      showFilterInput
      currentJobId={undefined}
    />
  ),
};

export const Selected: Story = {
  render: () => (
    <DownloadsView
      {...commonProps}
      jobs={sampleJobs}
      hasJobs
      showFilterInput
      currentJobId="1"
    />
  ),
};
