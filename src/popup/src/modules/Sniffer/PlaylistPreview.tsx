import React, { useEffect, useRef, useState } from "react";
import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { AspectRatio, Button, Card } from "@hls-downloader/design-system";
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
    []
  );

  const statusHint =
    status?.status === "fetching"
      ? "Sniffing playlist..."
      : status?.status === "error"
      ? "Playlist may not be playable yet."
      : null;

  const statusLabel =
    state === "loading"
      ? "Loading preview..."
      : state === "ready"
      ? "Preview ready"
      : state === "error"
      ? "Preview unavailable"
      : "Preview";

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] text-muted-foreground">{statusLabel}</div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={state === "loading"}
          aria-label="Reload preview"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      <AspectRatio
        ratio={16 / 9}
        className="relative overflow-hidden rounded-md bg-muted"
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          controls
          muted
          playsInline
        />
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 px-4 text-center">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {error ?? "Preview unavailable"}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReloadKey((key) => key + 1)}
              disabled={state === "loading"}
            >
              Try again
            </Button>
          </div>
        )}
      </AspectRatio>
      {statusHint && (
        <div className="text-[11px] text-muted-foreground">{statusHint}</div>
      )}
    </div>
  );
};

export default PlaylistPreview;
