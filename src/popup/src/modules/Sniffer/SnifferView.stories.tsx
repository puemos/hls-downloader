import React from "react";
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

const longPlaylists = [
  new Playlist(
    "1",
    "https://example.com/playlist1.m3u8",
    Date.now(),
    "A very long video title that should truncate nicely without hiding the timestamp on the right edge",
    "super-long-initiator-string-that-might-wrap",
  ),
  new Playlist(
    "2",
    "https://example.com/playlist2.m3u8",
    Date.now(),
    "Another lengthy title to test wrapping and truncation in the playlist cards within the Sniffer view",
    "another-long-initiator",
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
      copyPlaylistsToClipboard={() => {}}
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
      copyPlaylistsToClipboard={() => {}}
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
      copyPlaylistsToClipboard={() => {}}
    />
  ),
};

export const LongTitles: Story = {
  render: () => (
    <SnifferView
      playlists={longPlaylists}
      currentPlaylistId={undefined}
      filter=""
      clearPlaylists={() => {}}
      setFilter={() => {}}
      setCurrentPlaylistId={() => {}}
      copyPlaylistsToClipboard={() => {}}
    />
  ),
};
