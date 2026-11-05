import { Job, JobStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { jobsSlice } from "@hls-downloader/core/lib/store/slices";
import { StorageBucketStats } from "@hls-downloader/core/lib/use-cases/get-storage-stats";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// A download that has not finished a fragment for this long is treated as
// stalled, and its last speed is no longer shown.
export const SPEED_STALE_MS = 10_000;

export type JobViewDerived = {
  percent: number;
  headerStatusLabel: string;
  headerStatusVariant: "secondary" | "default" | "destructive" | "outline";
  isError: boolean;
  isQueued: boolean;
  isDownloading: boolean;
  isSaving: boolean;
  isReady: boolean;
  statusKind: "error" | "ready" | "active" | "idle";
  progress: {
    percent: number;
    done: number;
    total: number;
  };
  saving: {
    percent: number;
    message: string;
  };
  size: {
    expectedBytes?: number;
    storedBytes?: number;
    remainingBytes?: number;
    averageChunkBytes?: number;
    totalFragments?: number;
    availableBytes?: number;
  };
  speed: {
    bytesPerSecond?: number;
    secondsLeft?: number;
  };
};

interface ReturnType {
  status: JobStatus | null;
  job: Job | null;
  derived: JobViewDerived;
  bucket?: StorageBucketStats;
  downloadJob: () => void;
  deleteJob: () => void;
  cancelJob: () => void;
  saveAsJob: () => void;
  renameJob: (filename: string) => void;
}

const useJobController = ({ id }: { id: string }): ReturnType => {
  const dispatch = useDispatch();
  const status = useSelector<RootState, JobStatus | null>(
    (state) => state.jobs.jobsStatus[id],
  );
  const job = useSelector<RootState, Job | null>(
    (state) => state.jobs.jobs[id],
  );
  const bucket = useSelector<RootState, StorageBucketStats | undefined>(
    (state) => state.storage.buckets[id],
  );
  const availableBytes = useSelector<RootState, number | undefined>((state) =>
    state.storage.quotaIsAdvisory ? undefined : state.storage.availableBytes,
  );
  const now = useNow(status?.status === "downloading");
  const derived = buildJobViewDerived(status, bucket, availableBytes, now);

  function downloadJob() {
    dispatch(jobsSlice.actions.queue({ jobId: id }));
  }
  function deleteJob() {
    dispatch(jobsSlice.actions.delete({ jobId: id }));
  }
  function cancelJob() {
    dispatch(jobsSlice.actions.cancel({ jobId: id }));
  }
  function saveAsJob() {
    dispatch(jobsSlice.actions.saveAs({ jobId: id }));
  }
  function renameJob(filename: string) {
    dispatch(jobsSlice.actions.rename({ jobId: id, filename }));
  }
  return {
    status,
    job,
    derived,
    bucket,
    downloadJob,
    deleteJob,
    cancelJob,
    saveAsJob,
    renameJob,
  };
};

export default useJobController;

// Re-renders every second while active, so a stalled download stops showing
// its last speed even when no new state arrives.
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

export function buildJobViewDerived(
  status: JobStatus | null,
  bucket?: StorageBucketStats,
  availableBytes?: number,
  now = Date.now(),
): JobViewDerived {
  const isError = status?.status === "error";
  const isQueued = status?.status === "queued";
  const isDownloading =
    status?.status === "downloading" || status?.status === "preparing";
  const isSaving = status?.status === "saving";
  const isReady = ["ready", "done"].includes(status?.status ?? "");

  const percent =
    status?.status === "saving"
      ? Math.round((status.saveProgress ?? 0) * 100 || 0)
      : status?.total
        ? Math.round(((status.done ?? 0) / status.total) * 100)
        : isReady
          ? 100
          : 0;

  const statusMap: Record<
    string,
    { label: string; variant: JobViewDerived["headerStatusVariant"] }
  > = {
    init: { label: "Pending", variant: "outline" },
    queued: { label: "Queued", variant: "outline" },
    preparing: { label: "Preparing", variant: "default" },
    downloading: { label: "Downloading", variant: "default" },
    saving: { label: "Saving", variant: "default" },
    ready: { label: "Ready", variant: "secondary" },
    done: { label: "Completed", variant: "secondary" },
    error: { label: "Error", variant: "destructive" },
  };

  const headerStatusLabel =
    statusMap[status?.status ?? "queued"]?.label ?? "Queued";
  const headerStatusVariant =
    statusMap[status?.status ?? "queued"]?.variant ?? "outline";

  const progressDone =
    status?.status === "downloading" ? (status.done ?? 0) : 0;
  const progressTotal =
    status?.status === "downloading" ? (status.total ?? 0) : 0;
  const progressPercent =
    progressTotal > 0
      ? Math.max(0, Math.min(100, (progressDone / progressTotal) * 100))
      : 0;

  const savingPercent =
    status?.status === "saving"
      ? Math.max(0, Math.min(100, Math.round((status.saveProgress ?? 0) * 100)))
      : 0;
  const savingMessage =
    status?.status === "saving" ? status.saveMessage || "Saving..." : "";

  const statusKind: JobViewDerived["statusKind"] = isError
    ? "error"
    : isReady
      ? "ready"
      : isDownloading || isSaving
        ? "active"
        : "idle";

  const expectedBytes = bucket?.expectedBytes;
  const storedBytes = bucket?.storedBytes;
  const remainingBytes =
    expectedBytes !== undefined && storedBytes !== undefined
      ? Math.max(0, expectedBytes - storedBytes)
      : undefined;

  const speed = status?.speed;
  const bytesPerSecond =
    status?.status === "downloading" &&
    speed?.bytesPerSecond !== undefined &&
    speed.bytesPerSecond > 0 &&
    now - speed.updatedAt <= SPEED_STALE_MS
      ? speed.bytesPerSecond
      : undefined;
  const fragmentsLeft = progressTotal - progressDone;
  const bytesLeft =
    remainingBytes ??
    (status?.downloadedBytes !== undefined && progressDone > 0
      ? (fragmentsLeft * status.downloadedBytes) / progressDone
      : undefined);
  const secondsLeft =
    bytesPerSecond !== undefined && bytesLeft !== undefined && fragmentsLeft > 0
      ? bytesLeft / bytesPerSecond
      : undefined;

  return {
    percent,
    headerStatusLabel,
    headerStatusVariant,
    isError,
    isQueued,
    isDownloading,
    isSaving,
    isReady,
    statusKind,
    progress: {
      percent: progressPercent,
      done: progressDone,
      total: progressTotal,
    },
    saving: {
      percent: savingPercent,
      message: savingMessage,
    },
    size: {
      expectedBytes,
      storedBytes,
      remainingBytes,
      averageChunkBytes: bucket?.averageChunkBytes,
      totalFragments: bucket?.totalFragments,
      availableBytes,
    },
    speed: { bytesPerSecond, secondsLeft },
  };
}
