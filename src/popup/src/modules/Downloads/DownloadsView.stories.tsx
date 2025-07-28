import type { Meta, StoryObj } from "@storybook/react";
import { Job } from "@hls-downloader/core/lib/entities";
import DownloadsView from "./DownloadsView";

const meta: Meta<typeof DownloadsView> = {
  title: "popup/views/DownloadsView",
  component: DownloadsView,
};

export default meta;
type Story = StoryObj<typeof DownloadsView>;

const sampleJobs = [
  new Job("1", [], [], "video1.mp4", Date.now()),
  new Job("2", [], [], "video2.mp4", Date.now()),
];

export const Empty: Story = {
  render: () => (
    <DownloadsView
      jobs={[]}
      currentJobId={undefined}
      filter=""
      setCurrentJobId={() => {}}
      setFilter={() => {}}
    />
  ),
};

export const WithJobs: Story = {
  render: () => (
    <DownloadsView
      jobs={sampleJobs}
      currentJobId={undefined}
      filter=""
      setCurrentJobId={() => {}}
      setFilter={() => {}}
    />
  ),
};

export const Selected: Story = {
  render: () => (
    <DownloadsView
      jobs={sampleJobs}
      currentJobId="1"
      filter=""
      setCurrentJobId={() => {}}
      setFilter={() => {}}
    />
  ),
};
