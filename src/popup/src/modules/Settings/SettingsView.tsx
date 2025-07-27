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
    <div className="flex flex-col p-2 mt-4 space-y-4">
      <div className="flex items-center justify-between h-16 p-3 border rounded-md shrink-0">
        <div>
          <p className="text-sm font-semibold">Concurrency</p>
        </div>
        <div className="">
          <div className="flex flex-row items-center justify-center gap-2">
            <Button
              variant={"ghost"}
              aria-label="decrease fetch attempts"
              onClick={onConcurrencyDecrease}
            >
              -
            </Button>
            <Input className="w-16 text-center" value={concurrency} disabled />
            <Button
              variant={"ghost"}
              aria-label="increase fetch attempts"
              onClick={onConcurrencyIncrease}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between h-16 p-3 border rounded-md shrink-0">
        <div>
          <p className="text-sm font-semibold">Fetch Attempts</p>
        </div>
        <div className="">
          <div className="flex flex-row items-center justify-center gap-2">
            <Button
              variant={"ghost"}
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
              variant={"ghost"}
              aria-label="increase fetch attempts"
              onClick={onFetchAttemptsIncrease}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between h-16 p-3 border rounded-md shrink-0">
        <div>
          <p className="text-sm font-semibold">Save Dialog</p>
        </div>
        <div className="">
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
