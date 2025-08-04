import { Button, Input, Switch } from "@hls-downloader/design-system";
import React from "react";

interface Props {
  concurrency: number;
  fetchAttempts: number;
  saveDialog: boolean;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onConcurrencyIncrease: () => void;
  onConcurrencyDecrease: () => void;
}

const SettingsView = ({
  concurrency,
  fetchAttempts,
  saveDialog,
  onConcurrencyIncrease,
  onConcurrencyDecrease,
  onFetchAttemptsIncrease,
  onFetchAttemptsDecrease,
  onSaveDialogToggle,
}: Props) => {
  return (
    <div className="flex flex-col p-4 space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <p className="text-sm font-medium">Concurrency</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              aria-label="decrease concurrency"
              onClick={onConcurrencyDecrease}
            >
              -
            </Button>
            <Input className="w-16 text-center" value={concurrency} disabled />
            <Button
              size="sm"
              variant="ghost"
              aria-label="increase concurrency"
              onClick={onConcurrencyIncrease}
            >
              +
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <p className="text-sm font-medium">Fetch Attempts</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              aria-label="decrease fetch attempts"
              onClick={onFetchAttemptsDecrease}
            >
              -
            </Button>
            <Input
              className="w-16 text-center"
              value={fetchAttempts}
              disabled
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label="increase fetch attempts"
              onClick={onFetchAttemptsIncrease}
            >
              +
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <p className="text-sm font-medium">Save Dialog</p>
          <Switch
            aria-label="toggle save dialog"
            onClick={onSaveDialogToggle}
            checked={saveDialog}
          ></Switch>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
