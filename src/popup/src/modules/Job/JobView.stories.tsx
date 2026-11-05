import type { Meta, StoryObj } from "@storybook/react";
import { Job } from "@hls-downloader/core/lib/entities";
import JobView from "./JobView";
import { buildJobViewDerived } from "./JobController";

const meta: Meta<typeof JobView> = {
  title: "popup/views/JobView",
  component: JobView,
  decorators: [
    (Story, context) => (
      <div
        className={
          context.parameters.dark
            ? "dark h-full bg-background px-5 pt-4 text-foreground"
            : "h-full px-5 pt-4"
        }
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JobView>;

const sampleJob = new Job(
  "1",
  undefined,
  [],
  [],
  "hls.js demo-hls.mkv",
  Date.now(),
  768,
  576,
  7.7 * 1024 * 1024,
);
const detailBucket = {
  id: "1",
  storedBytes: 11.1 * 1024 * 1024,
  storedChunks: 10,
  totalFragments: 10,
  averageChunkBytes: 1.19 * 1024 * 1024,
  expectedBytes: 11.9 * 1024 * 1024,
  videoLength: 10,
  audioLength: 0,
  updatedAt: Date.now(),
};
const derive = (status: any, withStorage = false) =>
  buildJobViewDerived(status, withStorage ? detailBucket : undefined);

const downloadingStatus = () => ({
  status: "downloading" as const,
  total: 10,
  done: 3,
  downloadedBytes: 3.6 * 1024 * 1024,
  speed: {
    bytesPerSecond: 2.4 * 1024 * 1024,
    updatedAt: Date.now(),
    windowStartedAt: Date.now(),
    windowBytes: 0,
  },
});

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
      renameJob={() => {}}
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
      renameJob={() => {}}
      expanded={false}
      onToggle={() => {}}
    />
  ),
};

export const Downloading: Story = {
  render: () => (
    <JobView
      job={sampleJob}
      status={downloadingStatus()}
      derived={derive(downloadingStatus())}
      downloadJob={() => {}}
      deleteJob={() => {}}
      cancelJob={() => {}}
      saveAsJob={() => {}}
      renameJob={() => {}}
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
      renameJob={() => {}}
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
      renameJob={() => {}}
      expanded={false}
      onToggle={() => {}}
    />
  ),
};

export const SavingDetail: Story = {
  render: () => {
    const status = {
      status: "saving" as const,
      total: 10,
      done: 10,
      saveProgress: 0.48,
      saveMessage: "Preparing file",
    };
    return (
      <JobView
        job={sampleJob}
        status={status}
        derived={derive(status, true)}
        downloadJob={() => {}}
        deleteJob={() => {}}
        cancelJob={() => {}}
        saveAsJob={() => {}}
        renameJob={() => {}}
        expanded
        detail
        onToggle={() => {}}
      />
    );
  },
};

export const DownloadingDetail: Story = {
  render: () => {
    const status = downloadingStatus();
    return (
      <JobView
        job={sampleJob}
        status={status}
        derived={derive(status)}
        downloadJob={() => {}}
        deleteJob={() => {}}
        cancelJob={() => {}}
        saveAsJob={() => {}}
        renameJob={() => {}}
        expanded
        detail
        onToggle={() => {}}
      />
    );
  },
};

export const SavingDetailDark: Story = {
  ...SavingDetail,
  parameters: { dark: true },
};

export const ReadyDetail: Story = {
  render: () => {
    const status = { status: "ready" as const, total: 10, done: 10 };
    return (
      <JobView
        job={sampleJob}
        status={status}
        derived={derive(status, true)}
        downloadJob={() => {}}
        deleteJob={() => {}}
        cancelJob={() => {}}
        saveAsJob={() => {}}
        renameJob={() => {}}
        expanded
        detail
        onToggle={() => {}}
      />
    );
  },
};

export const ErrorDetail: Story = {
  render: () => {
    const status = {
      status: "error" as const,
      total: 10,
      done: 4,
      errorMessage: "The stream stopped responding before it finished.",
    };
    return (
      <JobView
        job={sampleJob}
        status={status}
        derived={derive(status, true)}
        downloadJob={() => {}}
        deleteJob={() => {}}
        cancelJob={() => {}}
        saveAsJob={() => {}}
        renameJob={() => {}}
        expanded
        detail
        onToggle={() => {}}
      />
    );
  },
};
