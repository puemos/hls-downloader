import { Button } from "@hls-downloader/design-system";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import BottomSheet from "../../components/BottomSheet";
import type { BulkDownloads } from "./useBulkDownloads";

export default function BulkDownloadSheet({ bulk }: { bulk: BulkDownloads }) {
  const qualityRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (bulk.mode !== "review") return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => qualityRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        bulk.back();
      }
      if (event.key !== "Tab") return;
      const controls = qualityRef.current
        ?.closest('[role="dialog"]')
        ?.querySelectorAll<HTMLElement>("button:not(:disabled), select");
      const first = controls?.[0],
        last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [bulk.mode]);
  return (
    <BottomSheet
      open={bulk.mode === "review"}
      onClose={bulk.back}
      labelledBy="bulk-download-title"
      closeLabel="Back to stream selection"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 -ml-1"
          onClick={bulk.back}
          aria-label="Back to stream selection"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3
            id="bulk-download-title"
            className="text-[14px] font-extrabold tracking-[-0.02em]"
          >
            Download selected streams
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Review quality and audio before adding to your queue.
          </p>
        </div>
      </div>
      <label className="mb-3 flex items-center justify-between gap-3 rounded-[10px] border border-border bg-muted/30 px-3 py-2.5">
        <span className="text-[11px] font-bold">Video quality</span>
        <span className="relative">
          <select
            ref={qualityRef}
            aria-label="Bulk video quality"
            value={bulk.quality}
            onChange={(e) => bulk.setQuality(e.target.value)}
            className="h-8 appearance-none rounded-[8px] border border-input bg-background py-1 pl-2.5 pr-7 text-[11px] font-semibold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="best">Best available</option>
            {[2160, 1080, 720, 480, 360].map((height) => (
              <option key={height} value={height}>
                Up to {height}p
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3 w-3 text-muted-foreground" />
        </span>
      </label>
      <div
        className="app-scrollbar max-h-[210px] overflow-y-auto rounded-[10px] border border-border"
        aria-label="Selected download details"
      >
        {bulk.items.map((item) => (
          <div
            key={item.playlist.id}
            data-bulk-review-row
            className="flex items-start gap-2.5 border-b border-border/70 px-3 py-2.5 last:border-b-0"
          >
            {item.error ? (
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            ) : item.checking ? (
              <LoaderCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[11px] font-bold"
                title={item.playlist.pageTitle || item.playlist.uri}
              >
                {item.playlist.pageTitle || item.playlist.uri}
              </p>
              <p
                className={`mt-1 text-[10px] leading-relaxed ${item.error ? "text-destructive" : "text-muted-foreground"}`}
              >
                {item.error ||
                  (item.checking
                    ? "Checking stream…"
                    : [
                        item.video?.type === "audio"
                          ? "Audio only"
                          : item.video?.height
                            ? `${item.video.height}p`
                            : "Original quality",
                        item.audio?.language ||
                          item.audio?.name ||
                          (item.video?.type === "audio"
                            ? item.video.language || item.video.name
                            : "Original audio"),
                        item.subtitle
                          ? `${item.subtitle.language || item.subtitle.name || "Selected"} subtitles · MKV`
                          : undefined,
                      ]
                        .filter(Boolean)
                        .join(" · "))}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p
        className="my-3 text-[10px] leading-relaxed text-muted-foreground"
        role="status"
      >
        {bulk.checking
          ? "Checking selected streams…"
          : bulk.items.some((item) => item.error)
            ? `${bulk.items.length - bulk.readyCount} stream${bulk.items.length - bulk.readyCount === 1 ? "" : "s"} can’t be queued. Only ready streams will be added.`
            : "Saved language choices and your active download limit apply."}
      </p>
      <Button
        className="h-10 w-full gap-2 text-[12px]"
        disabled={bulk.checking || bulk.readyCount === 0}
        onClick={bulk.queue}
      >
        <Download className="h-4 w-4" />
        Queue {bulk.readyCount} download{bulk.readyCount === 1 ? "" : "s"}
      </Button>
    </BottomSheet>
  );
}
