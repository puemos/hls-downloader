import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { Button, ScrollArea, cn } from "@hls-downloader/design-system";
import React from "react";
import { Metadata } from "../../components/Metadata";

interface Props {
  status: PlaylistStatus | null;
  levels: Level[];
  onDownloadLevelClick: (levelId: string) => void;
}

const PlaylistView = ({ levels, status, onDownloadLevelClick }: Props) => {
  if (!status) {
    return null;
  }
  if (status.status === "fetching") {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 mr-2 animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading...
      </div>
    );
  }
  if (status.status === "ready") {
    return (
      <ScrollArea className="h-[calc(100vh-10rem)] max-w-min">
        {levels.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex flex-col mb-2 items-start gap-2 rounded-lg border p-3 text-left text-sm",
            )}
          >
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.id}</div>
                </div>
                <div className={cn("ml-auto text-xs")}>{item.type === "audio" ? "Audio" : "Video"}</div>
              </div>
            </div>
            <div className="text-xs break-all text-muted-foreground">
              {item.uri}
            </div>
            <Metadata metadata={item} />
            <div className="flex flex-row-reverse w-full">
              <Button
                onClick={() => onDownloadLevelClick(item.id)}
                size="sm"
                variant="outline"
              >
                Download
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    );
  }

  return null;
};

export default PlaylistView;
