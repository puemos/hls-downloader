import { Job } from "@hls-downloader/core/lib/entities";
import { Button, cn, Input } from "@hls-downloader/design-system";
import {
  AlertTriangle,
  DownloadCloud,
  HardDrive,
  Search,
  X,
} from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import JobModule from "../Job/JobModule";
import { StorageState } from "@hls-downloader/core/lib/store/slices/storage-slice";
import InlineConfirm from "../../components/InlineConfirm";
import { formatBytes } from "../../utils/format-bytes";
import { RouterContext } from "../Navbar/RouterContext";
import { TabOptions } from "../Navbar/types";
import BackButton from "../../components/BackButton";
import ScreenHeader from "../../components/ScreenHeader";
import DetailScreen from "../../components/DetailScreen";
import BottomSheet from "../../components/BottomSheet";

interface Props {
  jobs: Job[];
  hasJobs: boolean;
  showFilterInput: boolean;
  currentJobId: string | undefined;
  filter: string;
  setCurrentJobId: (jobId?: string) => void;
  setFilter: (filter: string) => void;
  storage: StorageState;
  onCleanup: () => void;
  onRefreshStorage: () => void;
}

const DownloadsView = ({
  jobs,
  hasJobs,
  showFilterInput,
  filter,
  setFilter,
  currentJobId,
  setCurrentJobId,
  storage,
  onCleanup,
  onRefreshStorage,
}: Props) => {
  const { setTab } = useContext(RouterContext);
  const [storageOpen, setStorageOpen] = useState(false);
  const seenJobIds = useRef(new Set(jobs.map((job) => job.id)));
  const enteringJobIds = new Set(
    jobs.filter((job) => !seenJobIds.current.has(job.id)).map((job) => job.id),
  );

  useEffect(() => {
    jobs.forEach((job) => seenJobIds.current.add(job.id));
  }, [jobs]);

  useEffect(() => {
    if (!storageOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStorageOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [storageOpen]);

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col px-4 pt-4 ${
        currentJobId ? "pb-0" : "pb-3"
      }`}
    >
      {currentJobId ? (
        <DetailScreen className="flex min-h-0 flex-col">
          <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto pb-1 pr-1">
            <div className="flex h-full min-h-0 flex-col gap-2.5 p-1">
              <BackButton
                onClick={() => setCurrentJobId()}
                label="All downloads"
              />
              <JobModule id={currentJobId} detail />
            </div>
          </div>
        </DetailScreen>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-3">
          <ScreenHeader
            title="Downloads"
            action={
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={cn(
                  "h-8 w-8 shrink-0 text-muted-foreground",
                  storage.nearQuota &&
                    "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
                )}
                onClick={() => {
                  onRefreshStorage();
                  setStorageOpen(true);
                }}
                aria-label={
                  storage.nearQuota ? "Storage warning" : "Storage details"
                }
                title={storage.nearQuota ? "Storage is running low" : "Storage"}
              >
                {storage.nearQuota ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <HardDrive className="h-3.5 w-3.5" />
                )}
              </Button>
            }
          />
          {!hasJobs && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4 text-center">
              <div className="relative mb-4 grid h-[68px] w-[68px] place-items-center rounded-[18px] border border-border bg-card text-primary">
                <DownloadCloud className="h-8 w-8" strokeWidth={1.8} />
                <span className="absolute -right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              </div>
              <h3 className="text-[15px] font-bold tracking-[-0.01em]">
                Your queue is clear
              </h3>
              <p className="mt-1.5 max-w-[275px] text-[11px] leading-relaxed text-muted-foreground">
                Choose a captured stream and start a download. Progress will
                appear here in real time.
              </p>
            </div>
          )}
          {hasJobs && showFilterInput && (
            <div className="relative shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                aria-label="Filter downloads"
                className="h-9 pl-9 text-[12px]"
                placeholder="Filter downloads"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          )}
          {hasJobs && jobs.length === 0 && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4 text-center">
              <Search
                className="mb-3 h-6 w-6 text-muted-foreground"
                strokeWidth={1.8}
              />
              <h3 className="text-[14px] font-bold tracking-[-0.01em]">
                No matching downloads
              </h3>
              <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground">
                Nothing matches “{filter}”. Try another search or clear the
                filter.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setFilter("")}
              >
                Clear filter
              </Button>
            </div>
          )}
          {jobs.length > 0 && (
            <div className="app-scrollbar mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
              {jobs.map((item) => (
                <div
                  key={item.id}
                  className={
                    enteringJobIds.has(item.id)
                      ? "motion-list-entry"
                      : undefined
                  }
                >
                  <JobModule
                    id={item.id}
                    onOpen={() => setCurrentJobId(item.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomSheet
        open={!currentJobId && storageOpen}
        onClose={() => setStorageOpen(false)}
        labelledBy="storage-title"
        closeLabel="Close storage details"
      >
        <div className="flex items-center justify-between">
          <h3
            id="storage-title"
            className="text-[14px] font-extrabold tracking-[-0.02em]"
          >
            Storage
          </h3>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setStorageOpen(false)}
            aria-label="Close storage details"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-foreground text-background",
              storage.nearQuota &&
                "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25",
            )}
          >
            {storage.nearQuota ? (
              <AlertTriangle className="h-4.5 w-4.5" />
            ) : (
              <HardDrive className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold tabular-nums">
              {formatBytes(storage.totalUsedBytes)} stored
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {storage.quotaIsAdvisory
                ? "Flexible browser storage"
                : storage.availableBytes !== undefined
                  ? `${formatBytes(storage.availableBytes)} available`
                  : "Managed by your browser"}
            </p>
          </div>
        </div>

        {storage.nearQuota && (
          <p className="mt-3 rounded-[9px] border border-destructive/25 bg-destructive/10 px-3 py-2 text-[10px] font-medium leading-relaxed text-destructive">
            Storage is running low. Clean completed downloads to free space.
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <InlineConfirm
            label="Clean up"
            confirmLabel="Clean"
            cancelLabel="Cancel"
            onConfirm={onCleanup}
            busy={storage.cleanupStatus === "running"}
            disabled={storage.totalUsedBytes === 0}
            variant={storage.nearQuota ? "destructive" : "outline"}
          />
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              onRefreshStorage();
              setStorageOpen(false);
              setTab(TabOptions.SETTINGS);
            }}
          >
            Storage settings
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default DownloadsView;
