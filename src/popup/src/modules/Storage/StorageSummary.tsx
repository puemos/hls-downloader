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

interface StorageSummaryProps {
  usedBytes: number;
  availableBytes?: number;
  quotaBytes?: number;
  estimateSource?: string;
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
  estimateSource,
  nearQuota,
  loading,
  subtitlesBytes,
  cleanupStatus,
  onCleanup,
  onRefresh,
  compact = false,
}: StorageSummaryProps) => {
  const percent =
    quotaBytes && quotaBytes > 0
      ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100))
      : undefined;

  const cleaning = cleanupStatus === "running";
  const cleaned = cleanupStatus === "success";

  return (
    <Card className={cn("p-3", compact ? "space-y-2" : "space-y-3")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">IndexedDB storage</p>
            {nearQuota && (
              <Badge variant="destructive" className="text-[11px]">
                Low space
              </Badge>
            )}
            {cleaned && (
              <Badge variant="secondary" className="text-[11px]">
                Cleaned
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Used {formatBytes(usedBytes)}{" "}
            {availableBytes !== undefined && (
              <>
                • Available {formatBytes(availableBytes)}{" "}
                {quotaBytes !== undefined && (
                  <>of {formatBytes(quotaBytes, { precision: 1 })}</>
                )}
              </>
            )}
          </p>
          {subtitlesBytes !== undefined && subtitlesBytes > 0 && (
            <p className="text-[11px] text-muted-foreground leading-tight">
              Subtitles: {formatBytes(subtitlesBytes)} (included)
            </p>
          )}
          <p className="text-[11px] text-muted-foreground leading-tight">
            Source:{" "}
            {estimateSource === "navigator"
              ? "browser estimate"
              : "saved metadata"}
            {loading && " • updating..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              className="text-[12px] text-muted-foreground underline"
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </button>
          )}
          <InlineConfirm
            label="Clean storage"
            confirmLabel="Clean"
            cancelLabel="Keep"
            onConfirm={onCleanup}
            disabled={loading}
            busy={cleaning}
            variant={nearQuota ? "destructive" : "outline"}
          />
        </div>
      </div>
      {percent !== undefined && (
        <div className="space-y-2">
          <Progress value={percent} className="h-2 rounded-full" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{percent}% of quota</span>
            {availableBytes !== undefined && (
              <span>Free {formatBytes(availableBytes)}</span>
            )}
          </div>
        </div>
      )}
      {!compact && <Separator />}
      {!compact && (
        <p className="text-[11px] text-muted-foreground">
          Cleaning stops active downloads and clears cached fragments for this
          extension only.
        </p>
      )}
    </Card>
  );
};

export default StorageSummary;
