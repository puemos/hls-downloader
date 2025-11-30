import { Job } from "@hls-downloader/core/lib/entities";
import { Button, Input, ScrollArea } from "@hls-downloader/design-system";
import { TreePine } from "lucide-react";
import React, { useContext } from "react";
import PlaylistModule from "../Playlist/PlaylistModule";
import JobModule from "../Job/JobModule";
import { StorageState } from "@hls-downloader/core/lib/store/slices/storage-slice";
import InlineConfirm from "../../components/InlineConfirm";
import { formatBytes } from "../../utils/format-bytes";
import { RouterContext } from "../Navbar/RouterContext";
import { TabOptions } from "../Navbar/types";

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
  return (
    <div className="relative flex flex-col px-4 pb-24 space-y-4">
      <div
        style={{ display: currentJobId ? "block" : "none" }}
        className="space-y-4"
      >
        {currentJobId && (
          <>
            <Button
              onClick={() => setCurrentJobId()}
              size="sm"
              variant="secondary"
            >
              Back
            </Button>
            <PlaylistModule id={currentJobId}></PlaylistModule>
          </>
        )}
      </div>

      <div
        style={{ display: currentJobId ? "none" : "block" }}
        className="space-y-4"
      >
        {!currentJobId && !hasJobs && (
          <div className="flex flex-col items-center justify-center mt-32">
            <TreePine></TreePine>

            <h3 className="mt-4 text-lg font-semibold">No downloads yet</h3>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              As soon as you start a download, it will appear here.
            </p>
          </div>
        )}
        {!currentJobId && hasJobs && showFilterInput && (
          <div className="flex flex-col space-y-2">
            <h3 className="text-base font-semibold">Downloads</h3>
            <Input
              type="text"
              className="p-2 border rounded-md"
              placeholder="Filter downloads..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}
        {!currentJobId && hasJobs && (
          <ScrollArea className="h-[calc(100vh-12rem)] w-full max-w-full">
            {jobs.map((item) => (
              <JobModule key={item.id} id={item.id}></JobModule>
            ))}
          </ScrollArea>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/95 px-3 py-2 text-[12px] shadow-md backdrop-blur">
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm">
              Storage: {formatBytes(storage.totalUsedBytes)} used{" "}
              {storage.availableBytes !== undefined && (
                <>/ {formatBytes(storage.availableBytes)} free</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <InlineConfirm
              label="Clean"
              confirmLabel="Clean"
              cancelLabel="Cancel"
              onConfirm={onCleanup}
              busy={storage.cleanupStatus === "running"}
              variant={storage.nearQuota ? "destructive" : "outline"}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onRefreshStorage();
                setTab(TabOptions.SETTINGS);
              }}
            >
              Go to settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadsView;
