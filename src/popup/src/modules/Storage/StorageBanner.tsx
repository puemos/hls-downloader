import React from "react";
import InlineConfirm from "../../components/InlineConfirm";
import { formatBytes } from "../../utils/format-bytes";
import { CleanupStatus } from "@hls-downloader/core/lib/store/slices/storage-slice";

interface StorageBannerProps {
  visible: boolean;
  usedBytes: number;
  availableBytes?: number;
  cleanupStatus: CleanupStatus;
  onCleanup: () => void;
}

const StorageBanner = ({
  visible,
  usedBytes,
  availableBytes,
  cleanupStatus,
  onCleanup,
}: StorageBannerProps) => {
  if (!visible) {
    return null;
  }

  const cleaning = cleanupStatus === "running";

  return (
    <div className="mx-4 mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="text-sm font-semibold">Low storage</div>
          <div className="text-[12px] leading-tight">
            Using {formatBytes(usedBytes)}{" "}
            {availableBytes !== undefined && (
              <>• Only {formatBytes(availableBytes)} free</>
            )}
          </div>
        </div>
        <InlineConfirm
          label="Clean now"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={onCleanup}
          busy={cleaning}
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default StorageBanner;
