import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { Button, ScrollArea, Separator, cn } from "@hls-downloader/design-system";
import React from "react";
import { Metadata } from "../../components/Metadata";

interface Props {
  status: PlaylistStatus | null;
  videoLevels: Level[];
  audioLevels: Level[];
  selectedVideoId?: string;
  selectedAudioId?: string;
  onSelectVideo: (id: string) => void;
  onSelectAudio: (id: string) => void;
  onDownload: () => void;
  canDownload: boolean;
}

const PlaylistView = ({
  status,
  videoLevels,
  audioLevels,
  selectedVideoId,
  selectedAudioId,
  onSelectVideo,
  onSelectAudio,
  onDownload,
  canDownload,
}: Props) => {
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
      <ScrollArea className="h-[calc(100vh-10rem)] w-full max-w-full flex flex-col gap-4">
        {videoLevels.length > 0 && (
          <div>
            <div className="mb-2 font-semibold">Video</div>
            {videoLevels.map((item) => (
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
                </div>
              </div>
              <div className="text-xs break-all text-muted-foreground">
                {item.uri}
              </div>
              <Metadata metadata={item} />
              <div className="flex flex-row-reverse w-full">
                <Button
                  onClick={() => onSelectVideo(item.id)}
                  size="sm"
                  variant={item.id === selectedVideoId ? "default" : "secondary"}
                >
                  {item.id === selectedVideoId ? "Selected" : "Select"}
                </Button>
              </div>
              </div>
            ))}
          </div>
        )}
        {videoLevels.length > 0 && audioLevels.length > 0 && (
          <Separator className="my-2" />
        )}
        {audioLevels.length > 0 && (
          <div>
            <div className="mb-2 font-semibold">Audio</div>
            {audioLevels.map((item) => (
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
                </div>
              </div>
              <div className="text-xs break-all text-muted-foreground">
                {item.uri}
              </div>
              <Metadata metadata={item} />
              <div className="flex flex-row-reverse w-full">
                <Button
                  onClick={() => onSelectAudio(item.id)}
                  size="sm"
                  variant={item.id === selectedAudioId ? "default" : "secondary"}
                >
                  {item.id === selectedAudioId ? "Selected" : "Select"}
                </Button>
              </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-row-reverse mt-2">
          <Button onClick={onDownload} disabled={!canDownload} size="sm" variant="secondary">
            Download
          </Button>
        </div>
      </ScrollArea>
    );
  }

  return null;
};

export default PlaylistView;
