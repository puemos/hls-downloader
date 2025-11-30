import { Playlist } from "@hls-downloader/core/lib/entities";
import {
  Button,
  Input,
  ScrollArea,
  Card,
  cn,
} from "@hls-downloader/design-system";
import {
  Banana,
  ChevronDown,
  Clock4,
  Copy,
  Radio,
  ArrowRight,
} from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import PlaylistModule from "../Playlist/PlaylistModule";

interface Props {
  playlists: Playlist[];
  currentPlaylistId: string | undefined;
  filter: string;
  clearPlaylists: () => void;
  copyPlaylistsToClipboard: () => void;
  setFilter: (filter: string) => void;
  setCurrentPlaylistId: (playlistId?: string) => void;
  directURI: string;
  setDirectURI: (uri: string) => void;
  addDirectPlaylist: () => void;
  expandedPlaylists: string[];
  toggleExpandedPlaylist: (id: string) => void;
}

const SnifferView = ({
  clearPlaylists,
  copyPlaylistsToClipboard,
  setFilter,
  filter,
  playlists,
  currentPlaylistId,
  setCurrentPlaylistId,
  directURI,
  setDirectURI,
  addDirectPlaylist,
  expandedPlaylists,
  toggleExpandedPlaylist,
}: Props) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [visibleDetailId, setVisibleDetailId] = useState<string | undefined>(
    currentPlaylistId
  );
  const currentIdRef = useRef<string | undefined>(currentPlaylistId);

  useEffect(() => {
    if (currentPlaylistId) {
      setVisibleDetailId(currentPlaylistId);
    }
  }, [currentPlaylistId]);

  useEffect(() => {
    currentIdRef.current = currentPlaylistId;
  }, [currentPlaylistId]);

  useLayoutEffect(() => {
    const listEl = listRef.current;
    const detailEl = detailRef.current;
    if (!listEl || !detailEl) {
      return;
    }
    gsap.killTweensOf([listEl, detailEl]);
    const tl = gsap.timeline();

    if (!currentPlaylistId && !visibleDetailId) {
      gsap.set(listEl, { display: "block", opacity: 1, x: 0 });
      gsap.set(detailEl, { display: "none", opacity: 0, x: 0 });
      return;
    }

    if (currentPlaylistId && visibleDetailId === currentPlaylistId) {
      tl.set(listEl, { display: "none", opacity: 0 })
        .set(detailEl, { display: "block", x: 32, opacity: 0 })
        .to(detailEl, {
          x: 0,
          opacity: 1,
          duration: 0.28,
          ease: "power2.out",
        });
    } else if (!currentPlaylistId && visibleDetailId) {
      tl.to(detailEl, {
        x: 32,
        opacity: 0,
        duration: 0.24,
        ease: "power2.in",
      })
        .set(detailEl, { display: "none", x: 0 })
        .set(listEl, { display: "block", opacity: 0, x: -12 })
        .to(listEl, {
          opacity: 1,
          x: 0,
          duration: 0.24,
          ease: "power2.out",
          onComplete: () => {
            if (!currentIdRef.current) {
              setVisibleDetailId(undefined);
            }
          },
        });
    }

    return () => {
      tl.kill();
    };
  }, [currentPlaylistId, visibleDetailId]);

  useLayoutEffect(() => {
    gsap.killTweensOf(listRef.current);
  }, [playlists.length, filter]);

  return (
    <div className="flex flex-col px-4 pb-4 space-y-4">
      <div ref={detailRef} className="space-y-3" aria-hidden={!visibleDetailId}>
        {visibleDetailId && (
          <PlaylistModule
            id={visibleDetailId}
            onBack={() => setCurrentPlaylistId()}
          />
        )}
      </div>

      <div ref={listRef} className="space-y-4" aria-hidden={!!visibleDetailId}>
        <div className="flex flex-col space-y-3">
          <h3 className="text-base font-semibold">Sniffer</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="p-2 border rounded-md flex-1"
                placeholder="https://.../playlist.m3u8"
                value={directURI}
                onChange={(e) => setDirectURI(e.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={addDirectPlaylist}
                disabled={!directURI}
              >
                Add
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="p-2 border rounded-md flex-1"
                placeholder="Filter playlists..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={copyPlaylistsToClipboard}
                disabled={playlists.length === 0}
              >
                Copy URLs
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={clearPlaylists}
                disabled={playlists.length === 0}
              >
                Clear all
              </Button>
            </div>
          </div>
        </div>

        {playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-12">
            <Banana />

            <h3 className="mt-4 text-lg font-semibold">No videos found</h3>
            <p className="mt-2 mb-4 text-sm text-muted-foreground text-center">
              Try sniffing a page or paste a playlist URL above.
            </p>
          </div>
        )}

        {playlists.length > 0 && (
          <ScrollArea className="h-[calc(100vh-14rem)] w-full max-w-full view-transition view-enter-active">
            {playlists.map((item) => (
              <PlaylistRow
                key={item.id}
                playlist={item}
                expanded={expandedPlaylists.includes(item.id)}
                onToggle={() => toggleExpandedPlaylist(item.id)}
                onOpen={() => setCurrentPlaylistId(item.id)}
              />
            ))}
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default SnifferView;

const PlaylistRow = ({
  playlist,
  expanded,
  onToggle,
  onOpen,
}: {
  playlist: Playlist;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) => {
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (expanded) {
      gsap.set(el, { display: "block" });
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: "auto",
          opacity: 1,
          duration: 0.2,
          ease: "power1.out",
          clearProps: "height",
        }
      );
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.15,
        ease: "power1.in",
        onComplete: () => {
          gsap.set(el, { display: "none" });
        },
      });
    }
  }, [expanded]);

  return (
    <Card
      data-playlist-row
      className="mb-2 w-full overflow-hidden text-left text-sm"
    >
      <button
        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors"
        onClick={onToggle}
        aria-label="Toggle playlist details"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            expanded ? "rotate-180" : ""
          )}
        />
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="truncate font-semibold">{playlist.pageTitle}</div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <Clock4 className="h-3.5 w-3.5" />
          {new Date(playlist.createdAt!).toLocaleTimeString()}
        </div>
      </button>
      <div
        ref={detailsRef}
        className="px-3 pb-3 space-y-2 overflow-hidden"
        style={{ display: expanded ? "block" : "none" }}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Radio className="h-3.5 w-3.5" />
          <span className="truncate">
            {playlist.initiator || "Detected source"}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="font-medium text-foreground text-sm truncate">
            {playlist.uri}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              size="sm"
              variant="default"
              onClick={onOpen}
              className="gap-1"
            >
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() => navigator.clipboard?.writeText(playlist.uri)}
            >
              Copy URL <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
