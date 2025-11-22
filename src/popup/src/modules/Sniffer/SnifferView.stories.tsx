import React from "React";
import type { Meta, StoryObj } from "@storybook/react";
import { Provider } from "react-redux";
import { Playlist } from "@hls-downloader/core/lib/entities";
import SnifferView from "./SnifferView";

// Create a mock store for Storybook
const mockStore = {
  getState: () => ({
    playlistsStatus: {},
  }),
  dispatch: (action: any) => action,
  subscribe: () => () => {},
  replaceReducer: () => {},
  [Symbol.observable]: () => mockStore,
};

const meta: Meta<typeof SnifferView> = {
  title: "popup/views/SnifferView",
  component: SnifferView,
  decorators: [
    (Story) => (
      <Provider store={mockStore as any}>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SnifferView>;

const samplePlaylists = [
  new Playlist(
    "1",
    "https://example.com/playlist1.m3u8",
    Date.now(),
    "Sample Video 1",
    "hls.js",
  ),
  new Playlist(
    "2",
    "https://example.com/playlist2.m3u8",
    Date.now(),
    "Sample Video 2",
    "hls.js",
  ),
];

export const Empty: Story = {
  render: () => (
    <SnifferView
      playlists={[]}
      currentPlaylistId={undefined}
      filter=""
      clearPlaylists={() => {}}
      setFilter={() => {}}
      setCurrentPlaylistId={() => {}}
    />
  ),
};

export const WithItems: Story = {
  render: () => (
    <SnifferView
      playlists={samplePlaylists}
      currentPlaylistId={undefined}
      filter=""
      clearPlaylists={() => {}}
      setFilter={() => {}}
      setCurrentPlaylistId={() => {}}
    />
  ),
};

export const Selected: Story = {
  render: () => (
    <SnifferView
      playlists={samplePlaylists}
      currentPlaylistId="1"
      filter=""
      clearPlaylists={() => {}}
      setFilter={() => {}}
      setCurrentPlaylistId={() => {}}
    />
  ),
};
