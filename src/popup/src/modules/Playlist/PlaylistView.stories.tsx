import type { Meta, StoryObj } from "@storybook/react";
import { Level, Playlist } from "@hls-downloader/core/lib/entities";
import PlaylistView from "./PlaylistView";

const meta: Meta<typeof PlaylistView> = {
  title: "popup/views/PlaylistView",
  component: PlaylistView,
};

export default meta;
type Story = StoryObj<typeof PlaylistView>;

const videoLevel = new Level(
  "stream",
  "v1",
  "p1",
  "video.m3u8",
  1280,
  720,
  3000000,
  30
);
const audioLevel = new Level(
  "audio",
  "a1",
  "p1",
  "audio.m3u8",
  undefined,
  undefined,
  undefined,
  undefined,
  "eng",
  "English",
  undefined,
  undefined,
  "6",
  true,
  true,
  undefined,
  "audio"
);
const subtitleLevel = new Level(
  "subtitle",
  "s1",
  "p1",
  "subtitle.m3u8",
  undefined,
  undefined,
  undefined,
  undefined,
  "eng",
  "English"
);
const samplePlaylist = new Playlist(
  "p1",
  "https://example.com/master.m3u8",
  Date.now(),
  "Sample playlist",
  "storybook"
);

export const Ready: Story = {
  render: () => (
    <PlaylistView
      status={{ status: "ready" }}
      playlist={samplePlaylist}
      videoLevels={[videoLevel]}
      audioLevels={[audioLevel]}
      subtitleLevels={[subtitleLevel]}
      selectedVideoId="v1"
      selectedAudioId="a1"
      selectedSubtitleId="s1"
      onSelectVideo={() => {}}
      onSelectAudio={() => {}}
      onSelectSubtitle={() => {}}
      onDownload={() => {}}
      canDownload={true}
      encryptionSummaries={[
        {
          label: "Video",
          supported: true,
          method: "AES-128",
          keyUris: ["https://example.com/key"],
          pending: false,
        },
      ]}
      inspectionPending={false}
      encryptionBlocked={false}
    />
  ),
};

export const Fetching: Story = {
  render: () => (
    <PlaylistView
      status={{ status: "fetching" }}
      videoLevels={[]}
      audioLevels={[]}
      subtitleLevels={[]}
      onSelectVideo={() => {}}
      onSelectAudio={() => {}}
      onSelectSubtitle={() => {}}
      onDownload={() => {}}
      canDownload={false}
      encryptionSummaries={[]}
      inspectionPending={false}
      encryptionBlocked={false}
    />
  ),
};

export const DisabledDownload: Story = {
  render: () => (
    <PlaylistView
      status={{ status: "ready" }}
      playlist={samplePlaylist}
      videoLevels={[videoLevel]}
      audioLevels={[audioLevel]}
      subtitleLevels={[subtitleLevel]}
      selectedVideoId="v1"
      selectedAudioId="a1"
      selectedSubtitleId=""
      onSelectVideo={() => {}}
      onSelectAudio={() => {}}
      onSelectSubtitle={() => {}}
      onDownload={() => {}}
      canDownload={false}
      encryptionSummaries={[
        {
          label: "Video",
          supported: false,
          method: "SAMPLE-AES",
          keyUris: ["https://example.com/key"],
          pending: false,
          message: "Unsupported encryption method: SAMPLE-AES",
        },
      ]}
      inspectionPending={false}
      encryptionBlocked={true}
    />
  ),
};
