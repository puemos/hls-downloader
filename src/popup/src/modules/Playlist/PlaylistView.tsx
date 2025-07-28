import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { Button, ScrollArea, Separator } from "@hls-downloader/design-system";
import { ChevronRight } from "lucide-react";
import React, { useState } from "react";
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
  const [videoOpen, setVideoOpen] = useState(true);
  const [audioOpen, setAudioOpen] = useState(false);

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
      setVideoOpen(false);
      if (audioLevels.length > 0) {
        setAudioOpen(true);
      }
    }

    function handleSelectAudio(id: string) {
      onSelectAudio(id);
      setAudioOpen(false);
    }

    function getVideoDetails(item: Level) {
      return [
        item.width && item.height ? `${item.width}×${item.height}` : undefined,
        item.bitrate
          ? `${(item.bitrate / 1024 / 1024).toFixed(1)} mbps`
          : undefined,
        item.fps ? `${item.fps} fps` : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    function getAudioDetails(item: Level) {
      return [
        item.bitrate
          ? `${(item.bitrate / 1024 / 1024).toFixed(1)} mbps`
          : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    function truncateText(text: string, maxLength: number) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
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
          <div className="border rounded-md p-3 hover:bg-muted">
            <div
              className="mb-2 font-semibold cursor-pointer flex items-center justify-between"
              onClick={() => setVideoOpen((o) => !o)}
            >
              <span>Video</span>
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                {selectedVideo && !videoOpen && (
                  <span
                    className="text-sm text-muted-foreground font-normal truncate max-w-xs"
                    title={getDisplayText(
                      selectedVideo.id,
                      getVideoDetails(selectedVideo)
                    )}
                  >
                    {truncateText(
                      getDisplayText(
                        selectedVideo.id,
                        getVideoDetails(selectedVideo)
                      ),
                      40
                    )}
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${
                    videoOpen ? "rotate-90" : ""
                  }`}
                />
              </div>
            </div>
            {videoOpen && (
              <div className="space-y-2">
                {videoLevels.map((item) => {
                  const details = getVideoDetails(item);
                  return (
                    <Button
                      key={item.id}
                      variant={
                        item.id === selectedVideoId ? "secondary" : "outline"
                      }
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSelectVideo(item.id)}
                    >
                      <span className="truncate">
                        {getDisplayText(item.id, details)}
                      </span>
                    </Button>
                  );
                })}
                {selectedVideo && (
                  <>
                    {selectedVideo.uri && (
                      <div className="text-xs break-all text-muted-foreground mt-1">
                        {selectedVideo.uri}
                      </div>
                    )}
                    <Metadata metadata={selectedVideo} />
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {videoLevels.length > 0 && audioLevels.length > 0 && (
          <Separator className="my-2" />
        )}
        {audioLevels.length > 0 && (
          <div className="border rounded-md p-3 hover:bg-muted">
            <div
              className="mb-2 font-semibold cursor-pointer flex items-center justify-between"
              onClick={() => setAudioOpen((o) => !o)}
            >
              <span>Audio</span>
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                {selectedAudio && !audioOpen && (
                  <span
                    className="text-sm text-muted-foreground font-normal truncate max-w-xs"
                    title={getDisplayText(
                      selectedAudio.id,
                      getAudioDetails(selectedAudio)
                    )}
                  >
                    {truncateText(
                      getDisplayText(
                        selectedAudio.id,
                        getAudioDetails(selectedAudio)
                      ),
                      40
                    )}
                  </span>
                )}
                <ChevronRight
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${
                    audioOpen ? "rotate-90" : ""
                  }`}
                />
              </div>
            </div>
            {audioOpen && (
              <div className="space-y-2">
                {audioLevels.map((item) => {
                  const details = getAudioDetails(item);
                  return (
                    <Button
                      key={item.id}
                      variant={
                        item.id === selectedAudioId ? "secondary" : "outline"
                      }
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSelectAudio(item.id)}
                    >
                      <span className="truncate">
                        {getDisplayText(item.id, details)}
                      </span>
                    </Button>
                  );
                })}
                {selectedAudio && (
                  <>
                    {selectedAudio.uri && (
                      <div className="text-xs break-all text-muted-foreground mt-1">
                        {selectedAudio.uri}
                      </div>
                    )}
                    <Metadata metadata={selectedAudio} />
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-row-reverse mt-2">
          <Button
            onClick={onDownload}
            disabled={!canDownload}
            size="sm"
            variant="secondary"
          >
            Download
          </Button>
        </div>
      </ScrollArea>
    );
  }

  return null;
};

export default PlaylistView;
