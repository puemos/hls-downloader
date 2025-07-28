import type { Meta, StoryObj } from "@storybook/react";
import { Playlist } from "@hls-downloader/core/lib/entities";
import SnifferView from "./SnifferView";

const meta: Meta<typeof SnifferView> = {
  title: "popup/views/SnifferView",
  component: SnifferView,
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
