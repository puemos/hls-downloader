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
      fetchAttempts={5}
      saveDialog={true}
      onConcurrencyIncrease={() => {}}
      onConcurrencyDecrease={() => {}}
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
      fetchAttempts={1}
      saveDialog={false}
      onConcurrencyIncrease={() => {}}
      onConcurrencyDecrease={() => {}}
      onFetchAttemptsIncrease={() => {}}
      onFetchAttemptsDecrease={() => {}}
      onSaveDialogToggle={() => {}}
      preferredAudioLanguage={null}
      onSetPreferredAudioLanguage={() => {}}
    />
  ),
};
