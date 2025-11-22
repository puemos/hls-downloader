import type { Meta, StoryObj } from "@storybook/react";
import { Playlist } from "@hls-downloader/core/lib/entities";
import DirectView from "./DirectView";

const meta: Meta<typeof DirectView> = {
  title: "popup/views/DirectView",
  component: DirectView,
};

export default meta;
type Story = StoryObj<typeof DirectView>;

const samplePlaylists = [
  new Playlist(
    "1",
    "https://example.com/playlist1.m3u8",
    Date.now(),
    "Video 1",
    "script",
  ),
  new Playlist(
    "2",
    "https://example.com/playlist2.m3u8",
    Date.now(),
    "Video 2",
    "script",
  ),
];

export const Empty: Story = {
  render: () => (
    <DirectView
      playlists={[]}
      currentPlaylistId={undefined}
      filter=""
      directURI=""
      clearPlaylists={() => {}}
      addDirectPlaylist={() => {}}
      setCurrentPlaylistId={() => {}}
      setFilter={() => {}}
      setDirectURI={() => {}}
    />
  ),
};

export const WithPlaylists: Story = {
  render: () => (
    <DirectView
      playlists={samplePlaylists}
      currentPlaylistId={undefined}
      filter=""
      directURI=""
      clearPlaylists={() => {}}
      addDirectPlaylist={() => {}}
      setCurrentPlaylistId={() => {}}
      setFilter={() => {}}
      setDirectURI={() => {}}
    />
  ),
};

export const Selected: Story = {
  render: () => (
    <DirectView
      playlists={samplePlaylists}
      currentPlaylistId="1"
      filter=""
      directURI=""
      clearPlaylists={() => {}}
      addDirectPlaylist={() => {}}
      setCurrentPlaylistId={() => {}}
      setFilter={() => {}}
      setDirectURI={() => {}}
    />
  ),
};
