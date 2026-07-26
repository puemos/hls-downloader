import React, { useEffect, useRef, useState } from "react";
import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { AspectRatio, Button } from "@hls-downloader/design-system";
import Hls from "hls.js";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";

type PreviewState = "idle" | "loading" | "ready" | "error";

interface Props {
  playlist: Playlist;
  status?: PlaylistStatus | null;
  onDuration?: (seconds: number | null) => void;
}

const PlaylistPreview = ({ playlist, status, onDuration }: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<PreviewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const teardown = () => {
      const instance = hlsRef.current;
      if (instance) {
        instance.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
      onDuration?.(null);
    };

    teardown();

    if (!playlist?.uri) {
      setState("idle");
      setError(null);
      return;
    }

    setState("loading");
    setError(null);

    const onReady = () => {
      if (cancelled) return;
      setState("ready");
      if (video.duration && isFinite(video.duration)) {
        onDuration?.(video.duration);
      }
    };
    const onVideoError = () => {
      if (cancelled) return;
      teardown();
      setState("error");
      setError("Preview failed to load.");
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.addEventListener("loadedmetadata", onReady);
      video.addEventListener("error", onVideoError);
      video.src = playlist.uri;
      video.load();
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        backBufferLength: 120,
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, onReady);
      hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
        if (cancelled) return;
        if (typeof data?.details?.totalduration === "number") {
          onDuration?.(data.details.totalduration);
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (cancelled) return;
        if (data?.fatal) {
          teardown();
          setState("error");
          setError("Preview failed to load.");
        }
      });
      hls.attachMedia(video);
      hls.loadSource(playlist.uri);
    } else {
      setState("error");
      setError("HLS preview is not supported in this browser.");
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("error", onVideoError);
      teardown();
    };
  }, [playlist?.id, playlist?.uri, reloadKey]);

  useEffect(
    () => () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      const instance = hlsRef.current;
      if (instance) {
        instance.destroy();
        hlsRef.current = null;
      }
    },
    [],
  );

  const statusHint =
    status?.status === "fetching"
      ? "Sniffing playlist..."
      : status?.status === "error"
        ? "Playlist may not be playable yet."
        : null;

  if (state === "error") {
    return (
      <div className="pt-1">
        <div className="flex items-center gap-3 rounded-[9px] border border-border bg-muted/45 p-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-background text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold">Preview unavailable</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {error ?? "This stream could not be previewed."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
        {statusHint && (
          <p className="mt-2 text-[10px] text-muted-foreground">{statusHint}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <AspectRatio
        ratio={16 / 9}
        className="relative mx-auto max-w-[300px] overflow-hidden rounded-[9px] border border-border bg-muted"
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          controls
          muted
          playsInline
        />
        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">
              Loading preview…
            </span>
          </div>
        )}
        {state === "ready" && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7 bg-background/85"
            onClick={() => setReloadKey((key) => key + 1)}
            aria-label="Reload preview"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </AspectRatio>
      {statusHint && (
        <div className="text-[11px] text-muted-foreground">{statusHint}</div>
      )}
    </div>
  );
};

export default PlaylistPreview;
