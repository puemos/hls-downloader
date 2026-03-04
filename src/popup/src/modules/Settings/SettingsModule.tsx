import React from "react";
import SettingsView from "./SettingsView";
import useSettingsController from "./SettingsController";
import { useStorageInfo } from "../../hooks/useStorageInfo";

const SettingsModule = () => {
  const {
    onConcurrencyDecrease,
    onConcurrencyIncrease,
    onFetchAttemptsDecrease,
    onFetchAttemptsIncrease,
    fetchAttempts,
    onSaveDialogToggle,
    onAutoDeleteAfterSaveToggle,
    saveDialog,
    autoDeleteAfterSave,
    concurrency,
    preferredAudioLanguage,
    onSetPreferredAudioLanguage,
    maxActiveDownloads,
    activeDownloadsUnlimited,
    onActiveDownloadsDecrease,
    onActiveDownloadsIncrease,
    onActiveDownloadsUnlimited,
  } = useSettingsController();
  const { storage, startCleanup, refreshStorage } = useStorageInfo();

  return (
    <SettingsView
      fetchAttempts={fetchAttempts}
      onFetchAttemptsDecrease={onFetchAttemptsDecrease}
      onFetchAttemptsIncrease={onFetchAttemptsIncrease}
      onSaveDialogToggle={onSaveDialogToggle}
      onAutoDeleteAfterSaveToggle={onAutoDeleteAfterSaveToggle}
      saveDialog={saveDialog}
      autoDeleteAfterSave={autoDeleteAfterSave}
      onConcurrencyDecrease={onConcurrencyDecrease}
      onConcurrencyIncrease={onConcurrencyIncrease}
      concurrency={concurrency}
      preferredAudioLanguage={preferredAudioLanguage}
      onSetPreferredAudioLanguage={onSetPreferredAudioLanguage}
      maxActiveDownloads={maxActiveDownloads}
      activeDownloadsUnlimited={activeDownloadsUnlimited}
      onActiveDownloadsDecrease={onActiveDownloadsDecrease}
      onActiveDownloadsIncrease={onActiveDownloadsIncrease}
      onActiveDownloadsUnlimited={onActiveDownloadsUnlimited}
      storage={storage}
      onCleanupStorage={startCleanup}
      onRefreshStorage={refreshStorage}
    ></SettingsView>
  );
};

export default SettingsModule;
