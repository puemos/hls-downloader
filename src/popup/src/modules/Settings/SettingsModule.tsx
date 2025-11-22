import React from "react";
import SettingsView from "./SettingsView";
import useSettingsController from "./SettingsController";

const SettingsModule = () => {
  const {
    onConcurrencyDecrease,
    onConcurrencyIncrease,
    onFetchAttemptsDecrease,
    onFetchAttemptsIncrease,
    fetchAttempts,
    onSaveDialogToggle,
    saveDialog,
    concurrency,
    preferredAudioLanguage,
    onSetPreferredAudioLanguage,
  } = useSettingsController();

  return (
    <SettingsView
      fetchAttempts={fetchAttempts}
      onFetchAttemptsDecrease={onFetchAttemptsDecrease}
      onFetchAttemptsIncrease={onFetchAttemptsIncrease}
      onSaveDialogToggle={onSaveDialogToggle}
      saveDialog={saveDialog}
      onConcurrencyDecrease={onConcurrencyDecrease}
      onConcurrencyIncrease={onConcurrencyIncrease}
      concurrency={concurrency}
      preferredAudioLanguage={preferredAudioLanguage}
      onSetPreferredAudioLanguage={onSetPreferredAudioLanguage}
    ></SettingsView>
  );
};

export default SettingsModule;
