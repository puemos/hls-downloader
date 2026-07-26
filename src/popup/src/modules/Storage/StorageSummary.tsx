import React from "react";
import {
  Badge,
  Card,
  Progress,
  Separator,
  cn,
} from "@hls-downloader/design-system";
import InlineConfirm from "../../components/InlineConfirm";
import { formatBytes } from "../../utils/format-bytes";
import { CleanupStatus } from "@hls-downloader/core/lib/store/slices/storage-slice";
import { HardDrive, RefreshCcw } from "lucide-react";

interface StorageSummaryProps {
  usedBytes: number;
  availableBytes?: number;
  quotaBytes?: number;
  persisted?: boolean;
  quotaExempt: boolean;
  quotaIsAdvisory: boolean;
  nearQuota: boolean;
  loading: boolean;
  subtitlesBytes?: number;
  cleanupStatus: CleanupStatus;
  onCleanup: () => void;
  onRefresh?: () => void;
  compact?: boolean;
}

const StorageSummary = ({
  usedBytes,
  availableBytes,
  quotaBytes,
  persisted,
  quotaExempt,
  quotaIsAdvisory,
  nearQuota,
  loading,
  subtitlesBytes,
  cleanupStatus,
  onCleanup,
  onRefresh,
  compact = false,
}: StorageSummaryProps) => {
  const percent =
    !quotaIsAdvisory && quotaBytes && quotaBytes > 0
      ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100))
      : undefined;

  const cleaning = cleanupStatus === "running";
  const cleaned = cleanupStatus === "success";

  return (
    <Card
      className={cn("rounded-[11px] p-3", compact ? "space-y-2" : "space-y-3")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-foreground text-background">
            <HardDrive className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[12px] font-bold">Browser storage</p>
              {quotaExempt && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                  No fixed limit
                </Badge>
              )}
              {persisted && (
                <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                  Persistent
                </Badge>
              )}
              {nearQuota && (
                <Badge variant="destructive" className="px-1.5 py-0 text-[9px]">
                  Low space
                </Badge>
              )}
              {cleaned && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                  Cleaned
                </Badge>
              )}
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Stored {formatBytes(usedBytes)}{" "}
              {quotaIsAdvisory
                ? quotaBytes !== undefined && (
                    <>
                      • Browser estimate{" "}
                      {formatBytes(quotaBytes, { precision: 1 })}
                    </>
                  )
                : availableBytes !== undefined && (
                    <>
                      • Available {formatBytes(availableBytes)}{" "}
                      {quotaBytes !== undefined && (
                        <>of {formatBytes(quotaBytes, { precision: 1 })}</>
                      )}
                    </>
                  )}
            </p>
            {!compact && (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {quotaIsAdvisory ? (
                  <>
                    The browser estimate is informational, not a fixed download
                    limit.
                  </>
                ) : persisted ? (
                  "Persistent storage is enabled."
                ) : (
                  "Available storage is managed by your browser."
                )}
              </p>
            )}
            {subtitlesBytes !== undefined && subtitlesBytes > 0 && (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Subtitles: {formatBytes(subtitlesBytes)} (included)
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onRefresh && (
            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-accent hover:text-foreground active:scale-[0.96]"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh storage"
            >
              <RefreshCcw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
            </button>
          )}
          <InlineConfirm
            label="Clean storage"
            confirmLabel="Clean"
            cancelLabel="Keep"
            onConfirm={onCleanup}
            disabled={loading || usedBytes === 0}
            busy={cleaning}
            variant={nearQuota ? "destructive" : "outline"}
          />
        </div>
      </div>
      {percent !== undefined && (
        <div className="space-y-2">
          <Progress value={percent} className="h-2 rounded-full" />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{percent}% of browser allowance</span>
            {availableBytes !== undefined && (
              <span>Free {formatBytes(availableBytes)}</span>
            )}
          </div>
        </div>
      )}
      {!compact && <Separator />}
      {!compact && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Cleaning stops active downloads and clears cached fragments for this
          extension from browser storage only.
        </p>
      )}
    </Card>
  );
};

export default StorageSummary;
