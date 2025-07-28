import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { Button, ScrollArea, Separator } from "@hls-downloader/design-system";
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
    const selectedVideo = videoLevels.find((v) => v.id === selectedVideoId);
    const selectedAudio = audioLevels.find((a) => a.id === selectedAudioId);

    function handleSelectVideo(id: string) {
      onSelectVideo(id);
    }

    function handleSelectAudio(id: string) {
      onSelectAudio(id);
    }

    function getVideoDetails(item: Level) {
      return [
        item.width && item.height ? `${item.width}×${item.height}` : undefined,
        item.bitrate ? `${(item.bitrate / 1024 / 1024).toFixed(1)} mbps` : undefined,
        item.fps ? `${item.fps} fps` : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    function getAudioDetails(item: Level) {
      return [
        item.bitrate ? `${(item.bitrate / 1024 / 1024).toFixed(1)} mbps` : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    function getDisplayText(id: string, details: string) {
      if (details) {
        return `${details} (${id || "Unknown"})`;
      }
      return id || "Unknown";
    }

    return (
      <ScrollArea className="h-[calc(100vh-10rem)] w-full max-w-full flex flex-col gap-4">
        {videoLevels.length > 0 && (
          <div className="border rounded-md p-3 space-y-2">
            <h3 className="text-sm font-semibold">Video</h3>
            <select
              value={selectedVideoId}
              onChange={(e) => handleSelectVideo(e.target.value)}
              className="w-full rounded-md border p-2 text-sm bg-transparent"
            >
              <option value="" disabled>
                Select video quality
              </option>
              {videoLevels.map((item) => {
                const details = getVideoDetails(item);
                return (
                  <option key={item.id} value={item.id}>
                    {getDisplayText(item.id, details)}
                  </option>
                );
              })}
            </select>
            {selectedVideo && (
              <>
                {selectedVideo.uri && (
                  <div className="text-xs break-all text-muted-foreground">
                    {selectedVideo.uri}
                  </div>
                )}
                <Metadata metadata={selectedVideo} />
              </>
            )}
          </div>
        )}
        {videoLevels.length > 0 && audioLevels.length > 0 && (
          <Separator className="my-2" />
        )}
        {audioLevels.length > 0 && (
          <div className="border rounded-md p-3 space-y-2">
            <h3 className="text-sm font-semibold">Audio</h3>
            <select
              value={selectedAudioId}
              onChange={(e) => handleSelectAudio(e.target.value)}
              className="w-full rounded-md border p-2 text-sm bg-transparent"
            >
              <option value="" disabled>
                Select audio quality
              </option>
              {audioLevels.map((item) => {
                const details = getAudioDetails(item);
                return (
                  <option key={item.id} value={item.id}>
                    {getDisplayText(item.id, details)}
                  </option>
                );
              })}
            </select>
            {selectedAudio && (
              <>
                {selectedAudio.uri && (
                  <div className="text-xs break-all text-muted-foreground">
                    {selectedAudio.uri}
                  </div>
                )}
                <Metadata metadata={selectedAudio} />
              </>
            )}
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
