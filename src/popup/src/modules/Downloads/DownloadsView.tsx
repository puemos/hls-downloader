import { Job } from "@hls-downloader/core/lib/entities";
import { Button, Input, ScrollArea } from "@hls-downloader/design-system";
import { TreePine } from "lucide-react";
import React from "react";
import PlaylistModule from "../Playlist/PlaylistModule";
import JobModule from "../Job/JobModule";

interface Props {
  jobs: Job[];
  hasJobs: boolean;
  showFilterInput: boolean;
  currentJobId: string | undefined;
  filter: string;
  setCurrentJobId: (jobId?: string) => void;
  setFilter: (filter: string) => void;
}

const DownloadsView = ({
  jobs,
  hasJobs,
  showFilterInput,
  filter,
  setFilter,
  currentJobId,
  setCurrentJobId,
}: Props) => {
  return (
    <div className="flex flex-col px-4 pb-4 space-y-4">
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
          <ScrollArea className="h-[calc(100vh-10rem)] w-full max-w-full">
            {jobs.map((item) => (
              <JobModule key={item.id} id={item.id}></JobModule>
            ))}
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default DownloadsView;
