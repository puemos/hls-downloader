import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { Button, ScrollArea, Card } from "@hls-downloader/design-system";
import React from "react";
import { Video, Music2, Subtitles, Clipboard } from "lucide-react";

interface Props {
  status: PlaylistStatus | null;
  videoLevels: Level[];
  audioLevels: Level[];
  subtitleLevels: Level[];
  selectedVideoId?: string;
  selectedAudioId?: string;
  selectedSubtitleId?: string;
  onSelectVideo: (id: string) => void;
  onSelectAudio: (id: string) => void;
  onSelectSubtitle: (id: string) => void;
  onDownload: () => void;
  canDownload: boolean;
  encryptionSummaries: {
    label: string;
    supported: boolean;
    method: string | null;
    keyUris: string[];
    pending: boolean;
    message?: string;
  }[];
  inspectionPending: boolean;
  encryptionBlocked: boolean;
}

const PlaylistView = ({
  status,
  videoLevels,
  audioLevels,
  subtitleLevels,
  selectedVideoId,
  selectedAudioId,
  selectedSubtitleId,
  onSelectVideo,
  onSelectAudio,
  onSelectSubtitle,
  onDownload,
  canDownload,
  encryptionSummaries: _encryptionSummaries,
  inspectionPending,
  encryptionBlocked,
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
    const selectedSubtitle = subtitleLevels.find(
      (s) => s.id === selectedSubtitleId,
    );

    function handleSelectVideo(id: string) {
      onSelectVideo(id);
    }

    function handleSelectAudio(id: string) {
      onSelectAudio(id);
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
        item.language,
        item.name && item.name !== item.language ? item.name : undefined,
        item.channels ? `${item.channels}ch` : undefined,
        item.bitrate
          ? `${(item.bitrate / 1024 / 1024).toFixed(1)} mbps`
          : undefined,
        item.isDefault ? "default" : undefined,
        item.autoSelect ? "auto" : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    function getSubtitleDetails(item: Level) {
      return [
        item.language,
        item.name && item.name !== item.language ? item.name : undefined,
        item.characteristics,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    const footerMessage = [
      !canDownload && encryptionBlocked
        ? "Download blocked by encryption."
        : null,
      !canDownload && inspectionPending ? "Checking encryption..." : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="flex flex-col gap-4 p-1 pb-16">
          {videoLevels.length > 0 && (
            <Card className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4" /> Video
              </div>
              <div className="w-full border rounded-md">
                <select
                  className="w-full p-2 text-sm bg-transparent border-r-8 border-r-transparent"
                  value={selectedVideoId ?? ""}
                  onChange={(e) => handleSelectVideo(e.target.value)}
                >
                  <option value="" disabled>
                    Select video quality
                  </option>
                  {videoLevels.map((item) => {
                    const details = getVideoDetails(item);
                    return (
                      <option key={item.id} value={item.id}>
                        {details || item.id}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!selectedVideo?.uri}
                  onClick={() => {
                    if (!selectedVideo?.uri) return;
                    void navigator.clipboard?.writeText(selectedVideo.uri);
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </Card>
          )}

          {audioLevels.length > 0 && (
            <Card className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Music2 className="h-4 w-4" /> Audio
              </div>
              <div className="w-full border rounded-md">
                <select
                  className="w-full p-2 text-sm bg-transparent border-r-8 border-r-transparent"
                  value={selectedAudioId ?? ""}
                  onChange={(e) => handleSelectAudio(e.target.value)}
                >
                  <option value="" disabled>
                    Select audio track
                  </option>
                  {audioLevels.map((item) => {
                    const details = getAudioDetails(item);
                    return (
                      <option key={item.id} value={item.id}>
                        {details || item.id}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!selectedAudio?.uri}
                  onClick={() => {
                    if (!selectedAudio?.uri) return;
                    void navigator.clipboard?.writeText(selectedAudio.uri);
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </Card>
          )}

          {subtitleLevels.length > 0 && (
            <Card className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Subtitles className="h-4 w-4" /> Subtitles / CC
              </div>
              <div className="w-full border rounded-md">
                <select
                  className="w-full p-2 text-sm bg-transparent border-r-8 border-r-transparent"
                  value={selectedSubtitleId ?? ""}
                  onChange={(e) => onSelectSubtitle(e.target.value)}
                >
                  <option value="">No subtitles</option>
                  {subtitleLevels.map((item) => {
                    const details = getSubtitleDetails(item);
                    return (
                      <option key={item.id} value={item.id}>
                        {details || item.id}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!selectedSubtitle?.uri}
                  onClick={() => {
                    if (!selectedSubtitle?.uri) return;
                    void navigator.clipboard?.writeText(selectedSubtitle.uri);
                  }}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 bg-background/90 px-1 py-3 backdrop-blur">
          <div className="text-xs text-muted-foreground">{footerMessage}</div>
          <Button onClick={onDownload} disabled={!canDownload} size="sm">
            Download
          </Button>
        </div>
      </ScrollArea>
    );
  }

  return null;
};

export default PlaylistView;
