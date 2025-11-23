import type { Meta, StoryObj } from "@storybook/react";
import SettingsView from "./SettingsView";

const meta: Meta<typeof SettingsView> = {
  title: "popup/views/SettingsView",
  component: SettingsView,
};

export default meta;
type Story = StoryObj<typeof SettingsView>;

export const Default: Story = {
  render: () => (
    <SettingsView
      concurrency={3}
      maxActiveDownloads={2}
      activeDownloadsUnlimited={false}
      fetchAttempts={5}
      saveDialog={true}
      onConcurrencyIncrease={() => {}}
      onConcurrencyDecrease={() => {}}
      onActiveDownloadsIncrease={() => {}}
      onActiveDownloadsDecrease={() => {}}
      onActiveDownloadsUnlimited={() => {}}
      onFetchAttemptsIncrease={() => {}}
      onFetchAttemptsDecrease={() => {}}
      onSaveDialogToggle={() => {}}
      preferredAudioLanguage={"eng"}
      onSetPreferredAudioLanguage={() => {}}
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
      onConcurrencyIncrease={() => {}}
      onConcurrencyDecrease={() => {}}
      onActiveDownloadsIncrease={() => {}}
      onActiveDownloadsDecrease={() => {}}
      onActiveDownloadsUnlimited={() => {}}
      onFetchAttemptsIncrease={() => {}}
      onFetchAttemptsDecrease={() => {}}
      onSaveDialogToggle={() => {}}
      preferredAudioLanguage={null}
      onSetPreferredAudioLanguage={() => {}}
    />
  ),
};
