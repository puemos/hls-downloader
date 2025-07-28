import type { Meta, StoryObj } from "@storybook/react";
import { Level } from "@hls-downloader/core/lib/entities";
import PlaylistView from "./PlaylistView";

const meta: Meta<typeof PlaylistView> = {
  title: "popup/views/PlaylistView",
  component: PlaylistView,
};

export default meta;
type Story = StoryObj<typeof PlaylistView>;

const videoLevel = new Level("stream", "v1", "p1", "video.m3u8", 1280, 720, 3000000, 30);
const audioLevel = new Level("audio", "a1", "p1", "audio.m3u8");

export const Ready: Story = {
  render: () => (
    <PlaylistView
      status={{ status: "ready" }}
      videoLevels={[videoLevel]}
      audioLevels={[audioLevel]}
      onSelectVideo={() => {}}
      onSelectAudio={() => {}}
      onDownload={() => {}}
      canDownload={true}
    />
  ),
};

export const Fetching: Story = {
  render: () => (
    <PlaylistView
      status={{ status: "fetching" }}
      videoLevels={[]}
      audioLevels={[]}
      onSelectVideo={() => {}}
      onSelectAudio={() => {}}
      onDownload={() => {}}
      canDownload={false}
    />
  ),
};

export const DisabledDownload: Story = {
  render: () => (
    <PlaylistView
      status={{ status: "ready" }}
      videoLevels={[videoLevel]}
      audioLevels={[audioLevel]}
      onSelectVideo={() => {}}
      onSelectAudio={() => {}}
      onDownload={() => {}}
      canDownload={false}
    />
  ),
};
