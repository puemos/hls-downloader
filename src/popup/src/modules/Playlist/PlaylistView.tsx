import {
  Level,
  Playlist,
  PlaylistStatus,
} from "@hls-downloader/core/lib/entities";
import { Button, cn } from "@hls-downloader/design-system";
import React, { useEffect, useRef, useState } from "react";
import {
  Video,
  Music2,
  Subtitles,
  Check,
  Copy,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { formatBytes } from "../../utils/format-bytes";
import PlaylistPreview from "../Sniffer/PlaylistPreview";
import BackButton from "../../components/BackButton";
import {
  DetailHeader,
  DetailPanel,
  DetailRow,
} from "../../components/DetailSurface";
import BottomSheet from "../../components/BottomSheet";

interface Props {
  playlist?: Playlist | null;
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
  onBack?: () => void;
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
  estimate?: {
    expectedBytes?: number;
    storedBytes?: number;
    totalFragments?: number;
  };
}

const PlaylistView = ({
  playlist,
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
  onBack,
  encryptionSummaries: _encryptionSummaries,
  inspectionPending,
  encryptionBlocked,
  estimate,
}: Props) => {
  const [copied, setCopied] = useState<"video" | "audio" | "subtitle" | null>(
    null,
  );
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setShowPreview(false);
  }, [playlist?.id]);

  useEffect(() => {
    if (!showPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPreview(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showPreview]);
  if (!status) {
    return null;
  }

  if (status.status === "fetching") {
    return (
      <div className="space-y-4 p-1">
        {onBack && <BackButton label="All streams" onClick={() => onBack()} />}
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
            className="mr-2 h-4 w-4 animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Loading...
        </div>
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

    function copyTrack(kind: "video" | "audio" | "subtitle", uri?: string) {
      if (!uri) return;
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
      void navigator.clipboard?.writeText(uri);
      setCopied(kind);
      copyTimeout.current = setTimeout(() => setCopied(null), 1200);
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
      !canDownload && !encryptionBlocked && !inspectionPending
        ? "No compatible tracks found."
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto pb-3 pr-1">
          <div className="flex flex-col gap-2.5 p-1">
            {onBack && (
              <BackButton label="All streams" onClick={() => onBack()} />
            )}
            <DetailHeader
              title={playlist?.pageTitle || "Choose download quality"}
              supporting={
                playlist?.uri ? (
                  <p className="truncate font-mono text-[9px]">
                    {playlist.uri}
                  </p>
                ) : undefined
              }
              aside={
                <>
                  <p className="text-[9px] font-semibold text-muted-foreground">
                    Estimated
                  </p>
                  <p className="mt-0.5 text-[13px] font-extrabold tabular-nums">
                    {estimate?.expectedBytes !== undefined
                      ? `~${formatBytes(estimate.expectedBytes)}`
                      : "—"}
                  </p>
                </>
              }
            />

            <DetailPanel>
              {videoLevels.length > 0 && (
                <DetailRow
                  label="Video"
                  icon={Video}
                  action={
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      disabled={!selectedVideo?.uri}
                      onClick={() => copyTrack("video", selectedVideo?.uri)}
                      aria-label={
                        copied === "video"
                          ? "Video URL copied"
                          : "Copy video URL"
                      }
                      title="Copy video URL"
                    >
                      <CopyStateIcon copied={copied === "video"} />
                    </Button>
                  }
                >
                  <div className="relative">
                    <select
                      className="h-8 w-full appearance-none rounded-[8px] border border-input bg-background/70 px-2.5 pr-8 text-[11px] font-semibold text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
                      aria-label="Video quality"
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
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </DetailRow>
              )}

              {audioLevels.length > 0 && (
                <DetailRow
                  label="Audio"
                  icon={Music2}
                  action={
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      disabled={!selectedAudio?.uri}
                      onClick={() => copyTrack("audio", selectedAudio?.uri)}
                      aria-label={
                        copied === "audio"
                          ? "Audio URL copied"
                          : "Copy audio URL"
                      }
                      title="Copy audio URL"
                    >
                      <CopyStateIcon copied={copied === "audio"} />
                    </Button>
                  }
                >
                  <div className="relative">
                    <select
                      className="h-8 w-full appearance-none rounded-[8px] border border-input bg-background/70 px-2.5 pr-8 text-[11px] font-semibold text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
                      aria-label="Audio track"
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
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </DetailRow>
              )}

              {subtitleLevels.length > 0 && (
                <DetailRow
                  label="Subtitles"
                  icon={Subtitles}
                  action={
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      disabled={!selectedSubtitle?.uri}
                      onClick={() =>
                        copyTrack("subtitle", selectedSubtitle?.uri)
                      }
                      aria-label={
                        copied === "subtitle"
                          ? "Subtitles URL copied"
                          : "Copy subtitles URL"
                      }
                      title="Copy subtitles URL"
                    >
                      <CopyStateIcon copied={copied === "subtitle"} />
                    </Button>
                  }
                >
                  <div className="relative">
                    <select
                      className="h-8 w-full appearance-none rounded-[8px] border border-input bg-background/70 px-2.5 pr-8 text-[11px] font-semibold text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
                      aria-label="Subtitles"
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
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </DetailRow>
              )}

              {playlist && (
                <button
                  type="button"
                  className="group flex min-h-[48px] w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-accent/35 active:bg-accent/55"
                  onClick={() => setShowPreview(true)}
                  aria-label="Open stream preview"
                >
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    Preview
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                    Open
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              )}
            </DetailPanel>
            <span className="sr-only" aria-live="polite">
              {copied ? `${copied} URL copied` : ""}
            </span>
          </div>
        </div>
        <div className="-mx-4 shrink-0 border-t border-border bg-background px-4 py-2">
          <div className="flex min-h-8 items-center justify-between gap-3">
            <span
              className="min-w-0 truncate text-[9px] font-medium text-muted-foreground"
              role="status"
            >
              {footerMessage}
            </span>
            <Button
              size="sm"
              variant="default"
              disabled={!canDownload}
              onClick={onDownload}
              className="min-w-[140px] shrink-0"
            >
              Start download
            </Button>
          </div>
        </div>
        <BottomSheet
          open={showPreview && Boolean(playlist)}
          onClose={() => setShowPreview(false)}
          labelledBy="preview-title"
          closeLabel="Close preview"
        >
          {playlist && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3
                    id="preview-title"
                    className="text-[14px] font-extrabold tracking-[-0.02em]"
                  >
                    Stream preview
                  </h3>
                  <p className="mt-0.5 max-w-[380px] truncate text-[10px] text-muted-foreground">
                    {playlist.pageTitle || playlist.uri}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <PlaylistPreview playlist={playlist} status={status} />
            </>
          )}
        </BottomSheet>
      </div>
    );
  }

  return null;
};

const CopyStateIcon = ({ copied }: { copied: boolean }) => (
  <span className="grid h-3.5 w-3.5 place-items-center">
    <Copy
      data-active={!copied}
      className={cn(
        "motion-copy-icon col-start-1 row-start-1 h-3.5 w-3.5",
        copied ? "scale-90 opacity-0" : "scale-100 opacity-100",
      )}
    />
    <Check
      data-active={copied}
      className={cn(
        "motion-copy-icon col-start-1 row-start-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400",
        copied ? "scale-100 opacity-100" : "scale-90 opacity-0",
      )}
    />
  </span>
);

export default PlaylistView;
