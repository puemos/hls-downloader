import { Button, Switch, Card } from "@hls-downloader/design-system";
import React from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import StorageSummary from "../Storage/StorageSummary";
import type { StorageState } from "@hls-downloader/core/lib/store/slices/storage-slice";
import type { OutputContainer } from "@hls-downloader/core/lib/entities";

interface Props {
  concurrency: number;
  maxActiveDownloads: number;
  activeDownloadsUnlimited: boolean;
  fetchAttempts: number;
  saveDialog: boolean;
  autoDeleteAfterSave: boolean;
  outputContainer: OutputContainer;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onAutoDeleteAfterSaveToggle: () => void;
  onConcurrencyIncrease: () => void;
  onConcurrencyDecrease: () => void;
  onActiveDownloadsIncrease: () => void;
  onActiveDownloadsDecrease: () => void;
  onActiveDownloadsUnlimited: () => void;
  onSetOutputContainer: (outputContainer: OutputContainer) => void;
  preferredAudioLanguage?: string | null;
  onSetPreferredAudioLanguage: (lang: string | null) => void;
  storage: StorageState;
  onCleanupStorage: () => void;
  onRefreshStorage: () => void;
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

const OUTPUT_CONTAINER_OPTIONS: { value: OutputContainer; label: string }[] = [
  { value: "mp4", label: "MP4" },
  { value: "mkv", label: "MKV" },
];

const SettingsView = ({
  concurrency,
  fetchAttempts,
  saveDialog,
  autoDeleteAfterSave,
  outputContainer,
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
  onAutoDeleteAfterSaveToggle,
  onSetOutputContainer,
  preferredAudioLanguage = "",
  onSetPreferredAudioLanguage,
  storage,
  onCleanupStorage,
  onRefreshStorage,
}: Props) => {
  return (
    <div className="app-scrollbar h-full overflow-y-auto px-4 pb-6 pt-4">
      <div className="mb-3 px-1">
        <h2 className="text-[18px] font-extrabold leading-tight tracking-[-0.035em]">
          Settings
        </h2>
      </div>
      <StorageSummary
        compact
        usedBytes={storage.totalUsedBytes}
        availableBytes={storage.availableBytes}
        quotaBytes={storage.quotaBytes}
        persisted={storage.persisted}
        quotaExempt={storage.quotaExempt}
        quotaIsAdvisory={storage.quotaIsAdvisory}
        nearQuota={storage.nearQuota}
        loading={storage.loading}
        subtitlesBytes={storage.subtitlesBytes}
        cleanupStatus={storage.cleanupStatus}
        onCleanup={onCleanupStorage}
        onRefresh={onRefreshStorage}
      />
      <div className="mb-2 mt-4 px-1">
        <p className="eyebrow">Download behavior</p>
      </div>
      <div className="space-y-2">
        <Card className="flex-row items-center justify-between gap-3 rounded-[11px] shadow-none">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold">Active downloads</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
              Limit how many jobs run at once
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              variant={activeDownloadsUnlimited ? "default" : "outline"}
              className="h-7 px-2 text-[10px]"
              aria-label="set active downloads to unlimited"
              onClick={onActiveDownloadsUnlimited}
            >
              Unlimited
            </Button>
            {activeDownloadsUnlimited ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-[10px]"
                onClick={onActiveDownloadsIncrease}
              >
                Set limit
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  aria-label="decrease active downloads"
                  onClick={onActiveDownloadsDecrease}
                  disabled={maxActiveDownloads <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="flex h-7 w-10 items-center justify-center rounded-lg border bg-muted/60 px-2 text-center text-[11px] font-bold tabular-nums">
                  <span className="inline-flex min-w-[1ch] justify-center leading-tight">
                    {maxActiveDownloads}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  aria-label="increase active downloads"
                  onClick={onActiveDownloadsIncrease}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card className="gap-2.5 rounded-[11px] shadow-none">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[12px] font-bold">Output format</p>
            <p className="max-w-[245px] text-right text-[10px] leading-relaxed text-muted-foreground">
              Used for new downloads without subtitles
            </p>
          </div>
          <div className="relative min-w-[240px] flex-1">
            <select
              className="h-9 w-full appearance-none rounded-[10px] border bg-background/80 px-3 pr-9 text-[11px] font-semibold text-foreground outline-none transition-[border-color,box-shadow] focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
              value={outputContainer}
              onChange={(e) =>
                onSetOutputContainer(e.target.value as OutputContainer)
              }
            >
              {OUTPUT_CONTAINER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Card>

        <Card className="flex-row items-center justify-between gap-3 rounded-[11px] shadow-none">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold">Fragment concurrency</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
              Number of fragments fetched in parallel
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              aria-label="decrease fragment concurrency"
              onClick={onConcurrencyDecrease}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="flex h-7 w-10 items-center justify-center rounded-lg border bg-muted/60 text-center text-[11px] font-bold tabular-nums">
              <div className="inline-flex leading-tight min-w-[2ch] justify-center">
                {concurrency}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              aria-label="increase fragment concurrency"
              onClick={onConcurrencyIncrease}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </Card>

        <Card className="flex-row items-center justify-between gap-3 rounded-[11px] shadow-none">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold">Fetch attempts</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
              Retry count per fragment request
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              aria-label="decrease fetch attempts"
              onClick={onFetchAttemptsDecrease}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="flex h-7 w-10 items-center justify-center rounded-lg border bg-muted/60 text-center text-[11px] font-bold tabular-nums">
              <div className="inline-flex leading-tight min-w-[2ch] justify-center">
                {fetchAttempts}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              aria-label="increase fetch attempts"
              onClick={onFetchAttemptsIncrease}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </Card>

        <Card className="flex-row items-center justify-between gap-3 rounded-[11px] shadow-none">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold">Save dialog</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
              Ask for a location before saving files
            </p>
          </div>
          <Switch
            aria-label="toggle save dialog"
            onClick={onSaveDialogToggle}
            checked={saveDialog}
          ></Switch>
        </Card>

        <Card className="flex-row items-center justify-between gap-3 rounded-[11px] shadow-none">
          <div className="flex flex-col">
            <p className="text-[12px] font-bold">Auto delete after save</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
              Remove downloaded data after saving
            </p>
          </div>
          <Switch
            aria-label="toggle auto delete after save"
            onClick={onAutoDeleteAfterSaveToggle}
            checked={autoDeleteAfterSave}
          ></Switch>
        </Card>

        <Card className="gap-2.5 rounded-[11px] shadow-none">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[12px] font-bold">Preferred audio language</p>
            <p className="max-w-[245px] text-right text-[10px] leading-relaxed text-muted-foreground">
              Used to auto-pick audio when available
            </p>
          </div>
          <div className="relative min-w-[240px] flex-1">
            <select
              className="h-9 w-full appearance-none rounded-[10px] border bg-background/80 px-3 pr-9 text-[11px] font-semibold text-foreground outline-none transition-[border-color,box-shadow] focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
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
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;
