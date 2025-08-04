import type { Meta, StoryObj } from "@storybook/react";
import { Job } from "@hls-downloader/core/lib/entities";
import JobView from "./JobView";

const meta: Meta<typeof JobView> = {
  title: "popup/views/JobView",
  component: JobView,
};

export default meta;
type Story = StoryObj<typeof JobView>;

const sampleJob = new Job("1", [], [], "video.mp4", Date.now());

export const Init: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "init", total: 0, done: 0 }}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
    />
  ),
};

export const Downloading: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "downloading", total: 10, done: 3 }}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
    />
  ),
};

export const Saving: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{
        status: "saving",
        total: 10,
        done: 10,
        saveProgress: 0.5,
        saveMessage: "Processing",
      }}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
    />
  ),
};

export const Done: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "done", total: 10, done: 10 }}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
    />
  ),
};
