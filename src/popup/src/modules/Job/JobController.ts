import { Job, JobStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { jobsSlice } from "@hls-downloader/core/lib/store/slices";
import { StorageBucketStats } from "@hls-downloader/core/lib/use-cases/get-storage-stats";
import { useDispatch, useSelector } from "react-redux";

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
}

const useJobController = ({ id }: { id: string }): ReturnType => {
  const dispatch = useDispatch();
  const status = useSelector<RootState, JobStatus | null>(
    (state) => state.jobs.jobsStatus[id]
  );
  const job = useSelector<RootState, Job | null>(
    (state) => state.jobs.jobs[id]
  );
  const bucket = useSelector<RootState, StorageBucketStats | undefined>(
    (state) => state.storage.buckets[id]
  );
  const availableBytes = useSelector<RootState, number | undefined>(
    (state) => state.storage.availableBytes
  );
  const derived = buildJobViewDerived(status, bucket, availableBytes);

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
  return {
    status,
    job,
    derived,
    bucket,
    downloadJob,
    deleteJob,
    cancelJob,
    saveAsJob,
  };
};

export default useJobController;

export function buildJobViewDerived(
  status: JobStatus | null,
  bucket?: StorageBucketStats,
  availableBytes?: number
): JobViewDerived {
  const isError = status?.status === "error";
  const isQueued = status?.status === "queued";
  const isDownloading = status?.status === "downloading";
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

  const progressDone = status?.status === "downloading" ? status.done ?? 0 : 0;
  const progressTotal =
    status?.status === "downloading" ? status.total ?? 0 : 0;
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
  };
}
