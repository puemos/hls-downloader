import { Playlist } from "@hls-downloader/core/lib/entities";
import { Button, Input, Card } from "@hls-downloader/design-system";
import {
  Check,
  ChevronRight,
  Copy,
  Link2,
  ScanSearch,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import PlaylistModule from "../Playlist/PlaylistModule";
import ScreenHeader from "../../components/ScreenHeader";
import DetailScreen from "../../components/DetailScreen";
import BottomSheet from "../../components/BottomSheet";

interface Props {
  playlists: Playlist[];
  hasPlaylists: boolean;
  currentPlaylistId: string | undefined;
  filter: string;
  clearPlaylists: () => void;
  removePlaylist: (playlistId: string) => void;
  copyPlaylistsToClipboard: () => void;
  setFilter: (filter: string) => void;
  setCurrentPlaylistId: (playlistId?: string) => void;
  directURI: string;
  setDirectURI: (uri: string) => void;
  addDirectPlaylist: () => void;
}

const SnifferView = ({
  clearPlaylists,
  removePlaylist,
  copyPlaylistsToClipboard,
  setFilter,
  filter,
  playlists,
  hasPlaylists,
  currentPlaylistId,
  setCurrentPlaylistId,
  directURI,
  setDirectURI,
  addDirectPlaylist,
}: Props) => {
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const seenPlaylistIds = useRef(
    new Set(playlists.map((playlist) => playlist.id)),
  );
  const enteringPlaylistIds = new Set(
    playlists
      .filter((playlist) => !seenPlaylistIds.current.has(playlist.id))
      .map((playlist) => playlist.id),
  );

  useEffect(() => {
    playlists.forEach((playlist) => {
      seenPlaylistIds.current.add(playlist.id);
    });
  }, [playlists]);

  useEffect(() => {
    if (!manualOpen) {
      return;
    }
    manualInputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setManualOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [manualOpen]);

  return (
    <div
      className={`flex h-full min-h-0 flex-col px-4 pt-4 ${
        currentPlaylistId ? "pb-0" : "pb-3"
      }`}
    >
      {currentPlaylistId ? (
        <DetailScreen>
          <PlaylistModule
            id={currentPlaylistId}
            onBack={() => setCurrentPlaylistId()}
          />
        </DetailScreen>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-3">
          <ScreenHeader
            title="Capture"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1.5 px-2.5 text-[10px]"
                onClick={() => setManualOpen(true)}
              >
                <Link2 className="h-3.5 w-3.5" />
                Add URL
              </Button>
            }
          />

          {hasPlaylists && (
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  aria-label="Filter captured streams"
                  className="h-9 pl-9 text-[12px]"
                  placeholder="Filter captured streams"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <div className="flex h-9 shrink-0 items-center rounded-[9px] border border-input bg-card p-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={copyPlaylistsToClipboard}
                  aria-label="Copy all captured URLs"
                  title="Copy all URLs"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={clearPlaylists}
                  aria-label="Clear all captured streams"
                  title="Clear captured streams"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {!hasPlaylists && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4 text-center">
              <div className="relative mb-4 grid h-[68px] w-[68px] place-items-center rounded-[18px] border border-border bg-card text-primary">
                <ScanSearch className="h-8 w-8" strokeWidth={1.8} />
                <span className="absolute -right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
              </div>
              <h3 className="text-[15px] font-bold tracking-[-0.01em]">
                Ready to detect a stream
              </h3>
              <p className="mt-1.5 max-w-[280px] text-[11px] leading-relaxed text-muted-foreground">
                Start playback on the current page. Captured HLS playlists will
                appear here automatically.
              </p>
            </div>
          )}

          {hasPlaylists && playlists.length === 0 && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-8 text-center">
              <Search
                className="mb-3 h-6 w-6 text-muted-foreground"
                strokeWidth={1.8}
              />
              <h3 className="text-[14px] font-bold tracking-[-0.01em]">
                No matching streams
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

          {playlists.length > 0 && (
            <div className="app-scrollbar mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
              {playlists.map((item) => (
                <PlaylistRow
                  key={item.id}
                  playlist={item}
                  onOpen={() => setCurrentPlaylistId(item.id)}
                  onRemove={() => removePlaylist(item.id)}
                  animateEntry={enteringPlaylistIds.has(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <BottomSheet
        open={!currentPlaylistId && manualOpen}
        onClose={() => setManualOpen(false)}
        labelledBy="add-playlist-title"
        closeLabel="Close add URL"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3
            id="add-playlist-title"
            className="text-[14px] font-extrabold tracking-[-0.02em]"
          >
            Add playlist URL
          </h3>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setManualOpen(false)}
            aria-label="Close add URL"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={manualInputRef}
              type="url"
              aria-label="Playlist URL"
              className="h-10 pl-9 text-[12px]"
              placeholder="https://example.com/stream.m3u8"
              value={directURI}
              onChange={(e) => setDirectURI(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && directURI) {
                  addDirectPlaylist();
                  setManualOpen(false);
                }
              }}
            />
          </div>
          <Button
            className="h-10 min-w-[76px]"
            onClick={() => {
              addDirectPlaylist();
              setManualOpen(false);
            }}
            disabled={!directURI}
            aria-label="Add playlist"
          >
            Add
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default SnifferView;

const PlaylistRow = ({
  playlist,
  onOpen,
  onRemove,
  animateEntry,
}: {
  playlist: Playlist;
  onOpen: () => void;
  onRemove: () => void;
  animateEntry: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
    },
    [],
  );

  async function copyPlaylistUrl() {
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(playlist.uri);
      setCopied(true);
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card
      data-playlist-row
      className={`mb-2 w-full flex-row gap-0 overflow-hidden rounded-[11px] p-0 text-left text-sm ${
        animateEntry ? "motion-list-entry" : ""
      }`}
    >
      <button
        className="group flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-accent/35 active:bg-accent/55"
        onClick={onOpen}
        aria-label={`Choose quality for ${playlist.pageTitle || "captured stream"}`}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-bold leading-tight">
            {playlist.pageTitle}
          </div>
          <div className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
            {playlist.initiator || "Detected source"}
          </div>
        </div>
        <time className="shrink-0 text-[10px] font-medium text-muted-foreground">
          {new Date(playlist.createdAt!).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </button>
      <div className="flex shrink-0 items-center border-l border-border/70 px-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          onClick={copyPlaylistUrl}
          aria-label={
            copied
              ? `URL copied for ${playlist.pageTitle || "captured stream"}`
              : `Copy URL for ${playlist.pageTitle || "captured stream"}`
          }
          title={copied ? "URL copied" : "Copy URL"}
        >
          <span className="grid h-3.5 w-3.5 place-items-center">
            <Copy
              data-active={!copied}
              className={`motion-copy-icon col-start-1 row-start-1 h-3.5 w-3.5 ${
                copied ? "scale-90 opacity-0" : "scale-100 opacity-100"
              }`}
            />
            <Check
              data-active={copied}
              className={`motion-copy-icon col-start-1 row-start-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${
                copied ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
            />
          </span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={`Remove ${playlist.pageTitle || "captured stream"}`}
          title="Remove stream"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
};
