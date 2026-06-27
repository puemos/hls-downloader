import type { Meta, StoryObj } from "@storybook/react";
import SettingsView from "./SettingsView";
import type { StorageState } from "@hls-downloader/core/lib/store/slices/storage-slice";

const meta: Meta<typeof SettingsView> = {
  title: "popup/views/SettingsView",
  component: SettingsView,
};

export default meta;
type Story = StoryObj<typeof SettingsView>;

const storage: StorageState = {
  loading: false,
  buckets: {},
  totalUsedBytes: 0,
  estimateSource: "unknown",
  nearQuota: false,
  cleanupStatus: "idle",
};

export const Default: Story = {
  render: () => (
    <SettingsView
      concurrency={3}
      maxActiveDownloads={2}
      activeDownloadsUnlimited={false}
      fetchAttempts={5}
      saveDialog={true}
      autoDeleteAfterSave={false}
      outputContainer="mp4"
      onConcurrencyIncrease={() => {}}
      onConcurrencyDecrease={() => {}}
      onActiveDownloadsIncrease={() => {}}
      onActiveDownloadsDecrease={() => {}}
      onActiveDownloadsUnlimited={() => {}}
      onFetchAttemptsIncrease={() => {}}
      onFetchAttemptsDecrease={() => {}}
      onSaveDialogToggle={() => {}}
      onAutoDeleteAfterSaveToggle={() => {}}
      onSetOutputContainer={() => {}}
      preferredAudioLanguage={"eng"}
      onSetPreferredAudioLanguage={() => {}}
      storage={storage}
      onCleanupStorage={() => {}}
      onRefreshStorage={() => {}}
    />
  ),
};

export const Minimal: Story = {
  render: () => (
    <SettingsView
      concurrency={1}
      maxActiveDownloads={0}
      activeDownloadsUnlimited={true}
      fetchAttempts={1}
      saveDialog={false}
      autoDeleteAfterSave={true}
      outputContainer="mkv"
      onConcurrencyIncrease={() => {}}
      onConcurrencyDecrease={() => {}}
      onActiveDownloadsIncrease={() => {}}
      onActiveDownloadsDecrease={() => {}}
      onActiveDownloadsUnlimited={() => {}}
      onFetchAttemptsIncrease={() => {}}
      onFetchAttemptsDecrease={() => {}}
      onSaveDialogToggle={() => {}}
      onAutoDeleteAfterSaveToggle={() => {}}
      onSetOutputContainer={() => {}}
      preferredAudioLanguage={null}
      onSetPreferredAudioLanguage={() => {}}
      storage={storage}
      onCleanupStorage={() => {}}
      onRefreshStorage={() => {}}
    />
  ),
};
