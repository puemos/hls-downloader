import { Button, Switch, Input, Card } from "@hls-downloader/design-system";
import React from "react";

interface Props {
  concurrency: number;
  maxActiveDownloads: number;
  activeDownloadsUnlimited: boolean;
  fetchAttempts: number;
  saveDialog: boolean;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onConcurrencyIncrease: () => void;
  onConcurrencyDecrease: () => void;
  onActiveDownloadsIncrease: () => void;
  onActiveDownloadsDecrease: () => void;
  onActiveDownloadsUnlimited: () => void;
  preferredAudioLanguage?: string | null;
  onSetPreferredAudioLanguage: (lang: string | null) => void;
}

const LANG_OPTIONS = [
  { code: "", label: "Auto (no preference)" },
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "rus", label: "Russian" },
  { code: "zho", label: "Chinese" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "hin", label: "Hindi" },
  { code: "ara", label: "Arabic" },
  { code: "tur", label: "Turkish" },
  { code: "pol", label: "Polish" },
  { code: "nld", label: "Dutch" },
  { code: "swe", label: "Swedish" },
  { code: "nor", label: "Norwegian" },
  { code: "dan", label: "Danish" },
  { code: "fin", label: "Finnish" },
  { code: "heb", label: "Hebrew" },
  { code: "tha", label: "Thai" },
  { code: "vie", label: "Vietnamese" },
  { code: "ind", label: "Indonesian" },
  { code: "ron", label: "Romanian" },
  { code: "hun", label: "Hungarian" },
  { code: "ces", label: "Czech" },
  { code: "ell", label: "Greek" },
  { code: "ukr", label: "Ukrainian" },
];

const SettingsView = ({
  concurrency,
  fetchAttempts,
  saveDialog,
  onConcurrencyIncrease,
  onConcurrencyDecrease,
  onActiveDownloadsIncrease,
  onActiveDownloadsDecrease,
  onActiveDownloadsUnlimited,
  activeDownloadsUnlimited,
  maxActiveDownloads,
  onFetchAttemptsIncrease,
  onFetchAttemptsDecrease,
  onSaveDialogToggle,
  preferredAudioLanguage = "",
  onSetPreferredAudioLanguage,
}: Props) => {
  return (
    <div className="flex flex-col px-4 pb-4 space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>
      <div className="space-y-3">
        <Card className="flex-row items-center justify-between gap-2">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Active downloads</p>
            <p className="text-[11px] text-muted-foreground">
              Limit how many jobs run at once
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeDownloadsUnlimited ? "default" : "outline"}
              aria-label="set active downloads to unlimited"
              onClick={onActiveDownloadsUnlimited}
            >
              Unlimited
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="decrease active downloads"
              onClick={onActiveDownloadsDecrease}
              disabled={activeDownloadsUnlimited || maxActiveDownloads <= 1}
            >
              -
            </Button>
            <div className="w-16 border rounded-md h-8 flex items-center bg-muted justify-center text-center text-sm px-2">
              <div>
                {activeDownloadsUnlimited ? (
                  "∞"
                ) : (
                  <span className="inline-flex leading-tight min-w-[1ch] justify-center">
                    {maxActiveDownloads}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              aria-label="increase active downloads"
              onClick={onActiveDownloadsIncrease}
            >
              +
            </Button>
          </div>
        </Card>

        <Card className="flex-row items-center justify-between gap-2">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Fragment concurrency</p>
            <p className="text-[11px] text-muted-foreground">
              Number of fragments fetched in parallel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label="decrease fragment concurrency"
              onClick={onConcurrencyDecrease}
            >
              -
            </Button>
            <div className="w-16 border rounded-md h-8 flex items-center bg-muted justify-center text-center text-sm">
              <div className="inline-flex leading-tight min-w-[2ch] justify-center">
                {concurrency}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              aria-label="increase fragment concurrency"
              onClick={onConcurrencyIncrease}
            >
              +
            </Button>
          </div>
        </Card>

        <Card className="flex-row items-center justify-between gap-2">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Fetch attempts</p>
            <p className="text-[11px] text-muted-foreground">
              Retry count per fragment request
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label="decrease fetch attempts"
              onClick={onFetchAttemptsDecrease}
            >
              -
            </Button>
            <div className="w-16 border rounded-md h-8 flex items-center bg-muted justify-center text-center text-sm">
              <div className="inline-flex leading-tight min-w-[2ch] justify-center">
                {fetchAttempts}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              aria-label="increase fetch attempts"
              onClick={onFetchAttemptsIncrease}
            >
              +
            </Button>
          </div>
        </Card>

        <Card className="flex-row items-center justify-between gap-2">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Save dialog</p>
            <p className="text-[11px] text-muted-foreground">
              Ask for a location before saving files
            </p>
          </div>
          <Switch
            aria-label="toggle save dialog"
            onClick={onSaveDialogToggle}
            checked={saveDialog}
          ></Switch>
        </Card>

        <Card className="gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Preferred audio language</p>
            <p className="text-[11px] text-muted-foreground">
              Used to auto-pick audio when available
            </p>
          </div>
          <div className="flex-1 min-w-[240px] border rounded-md">
            <select
              className="w-full p-2 text-sm bg-transparent border-r-8 border-r-transparent"
              value={preferredAudioLanguage ?? ""}
              onChange={(e) =>
                onSetPreferredAudioLanguage(e.target.value || null)
              }
            >
              {LANG_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label} {option.code ? `(${option.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;
