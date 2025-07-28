import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Job } from "@hls-downloader/core/lib/entities";
import DownloadsView from "./DownloadsView";

// Create a mock store for Storybook using configureStore
const mockStore = configureStore({
  reducer: {
    downloads: (state = { playlistsStatus: {}, jobsStatus: {} }) => state,
    jobs: (state = { jobs: {}, jobsStatus: {} }) => state,
  },
  preloadedState: {
    downloads: {
      playlistsStatus: {},
      jobsStatus: {},
    },
    jobs: {
      jobs: {},
      jobsStatus: {},
    },
  },
});

const meta: Meta<typeof DownloadsView> = {
  title: "popup/views/DownloadsView",
  component: DownloadsView,
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <Story />
      </Provider>
    ),
  ],
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
