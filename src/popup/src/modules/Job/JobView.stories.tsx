import type { Meta, StoryObj } from "@storybook/react";
import { Job } from "@hls-downloader/core/lib/entities";
import JobView from "./JobView";
import { buildJobViewDerived } from "./JobController";

const meta: Meta<typeof JobView> = {
  title: "popup/views/JobView",
  component: JobView,
};

export default meta;
type Story = StoryObj<typeof JobView>;

const sampleJob = new Job("1", [], [], "video.mp4", Date.now());
const derive = (status: any) => buildJobViewDerived(status);

export const Init: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "init", total: 0, done: 0 }}
      derived={derive({ status: "init", total: 0, done: 0 })}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
      expanded={false}
      onToggle={() => {}}
    />
  ),
};

export const Queued: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "queued", total: 10, done: 0 }}
      derived={derive({ status: "queued", total: 10, done: 0 })}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
      expanded={false}
      onToggle={() => {}}
    />
  ),
};

export const Downloading: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "downloading", total: 10, done: 3 }}
      derived={derive({ status: "downloading", total: 10, done: 3 })}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
      expanded={true}
      onToggle={() => {}}
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
      derived={derive({
        status: "saving",
        total: 10,
        done: 10,
        saveProgress: 0.5,
        saveMessage: "Processing",
      })}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
      expanded={true}
      onToggle={() => {}}
    />
  ),
};

export const Done: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={{ status: "done", total: 10, done: 10 }}
      derived={derive({ status: "done", total: 10, done: 10 })}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
      expanded={false}
      onToggle={() => {}}
    />
  ),
};
