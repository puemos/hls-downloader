import type { Preview } from "@storybook/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  Fragment,
  Job,
  Key,
  Level,
  Playlist,
} from "@hls-downloader/core/lib/entities";
import {
  RootState,
  rootReducer,
} from "@hls-downloader/core/lib/store/root-reducer";
import "../src/index.css";

const baseState: RootState = rootReducer(undefined, { type: "init" });
const playlistId = "1";
const otherPlaylistId = "2";

const videoLevel = new Level(
  "stream",
  "video-1080p",
  playlistId,
  "https://example.com/video-1080p.m3u8",
  1920,
  1080,
  4_500_000,
  30,
);
const audioLevel = new Level(
  "audio",
  "audio-en",
  playlistId,
  "https://example.com/audio-en.m3u8",
  undefined,
  undefined,
  192_000,
  undefined,
  "en",
  "English",
);
const subtitleLevel = new Level(
  "subtitle",
  "subtitle-en",
  playlistId,
  "https://example.com/subtitles-en.vtt",
  undefined,
  undefined,
  undefined,
  undefined,
  "en",
  "English",
  "cc",
);

const jobOne = new Job(
  "1",
  playlistId,
  [new Fragment(new Key(), "v1.ts", 0)],
  [new Fragment(new Key(), "a1.ts", 0)],
  "Example video.mp4",
  Date.now(),
  1920,
  1080,
  4_500_000,
);
const jobTwo = new Job(
  "2",
  otherPlaylistId,
  [new Fragment(new Key(), "v2.ts", 0)],
  [],
  "Second video.mp4",
  Date.now(),
  1280,
  720,
  2_000_000,
);

// Seed Storybook with a lightweight Redux store so hooks using `useSelector` and `useDispatch` work out of the box.
const preloadedState: RootState = {
  ...baseState,
  playlists: {
    ...baseState.playlists,
    playlists: {
      ...baseState.playlists.playlists,
      [playlistId]: new Playlist(
        playlistId,
        "https://example.com/master.m3u8",
        Date.now(),
        "Storybook playlist",
        "storybook",
      ),
      [otherPlaylistId]: new Playlist(
        otherPlaylistId,
        "https://example.com/other.m3u8",
        Date.now(),
        "Another playlist",
        "storybook",
      ),
    },
    playlistsStatus: {
      ...baseState.playlists.playlistsStatus,
      [playlistId]: { status: "ready" },
      [otherPlaylistId]: { status: "ready" },
    },
  },
  levels: {
    ...baseState.levels,
    levels: {
      ...baseState.levels.levels,
      [videoLevel.id]: videoLevel,
      [audioLevel.id]: audioLevel,
      [subtitleLevel.id]: subtitleLevel,
    },
  },
  jobs: {
    ...baseState.jobs,
    jobs: {
      ...baseState.jobs.jobs,
      [jobOne.id]: jobOne,
      [jobTwo.id]: jobTwo,
    },
    jobsStatus: {
      ...baseState.jobs.jobsStatus,
      [jobOne.id]: {
        status: "ready",
        total: jobOne.videoFragments.length + jobOne.audioFragments.length,
        done: jobOne.videoFragments.length + jobOne.audioFragments.length,
      },
      [jobTwo.id]: {
        status: "init",
        total: jobTwo.videoFragments.length + jobTwo.audioFragments.length,
        done: 0,
      },
    },
  },
  storage: {
    ...baseState.storage,
    buckets: {
      [jobOne.id]: {
        id: jobOne.id,
        storedBytes: 126 * 1024 * 1024,
        storedChunks: 2,
        totalFragments: 2,
        averageChunkBytes: 63 * 1024 * 1024,
        expectedBytes: 126 * 1024 * 1024,
        videoLength: 1,
        audioLength: 1,
        updatedAt: Date.now(),
      },
    },
    totalUsedBytes: 126 * 1024 * 1024,
    availableBytes: 7.88 * 1024 * 1024 * 1024,
    quotaBytes: 8 * 1024 * 1024 * 1024,
    persisted: true,
    lastUpdated: Date.now(),
  },
};

const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    preloadedState,
  });

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Provider store={createStore()}>
        <div className="h-[600px] w-[500px] overflow-hidden">
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default preview;
