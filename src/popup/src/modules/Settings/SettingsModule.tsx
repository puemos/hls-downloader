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
    ></SettingsView>
  );
};

export default SettingsModule;
