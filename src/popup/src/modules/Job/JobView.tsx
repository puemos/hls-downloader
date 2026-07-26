import { Job, JobStatus } from "@hls-downloader/core/lib/entities";
import {
  Button,
  Card,
  Progress,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  ScrollArea,
  cn,
} from "@hls-downloader/design-system";
import {
  Trash2Icon,
  DownloadIcon,
  AlertTriangle,
  Loader2,
  Copy,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock4,
} from "lucide-react";
import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Metadata } from "../../components/Metadata";
import { formatBytes } from "../../utils/format-bytes";
import {
  DetailHeader,
  DetailPanel,
  DetailRow,
} from "../../components/DetailSurface";

interface Props {
  job: Job | null;
  status: JobStatus | null;
  derived: import("./JobController").JobViewDerived;
  downloadJob: () => void;
  deleteJob: () => void;
  cancelJob: () => void;
  saveAsJob: () => void;
  expanded: boolean;
  onToggle: () => void;
  navigation?: boolean;
  detail?: boolean;
}

const JobView = ({
  status,
  derived,
  job,
  downloadJob,
  deleteJob,
  cancelJob,
  saveAsJob,
  expanded,
  onToggle,
  navigation = false,
  detail = false,
}: Props) => {
  if (!job) {
    return null;
  }

  const {
    percent,
    headerStatusLabel,
    headerStatusVariant,
    isError,
    isQueued,
    isDownloading,
    isSaving,
    isReady,
    statusKind,
    progress,
    saving,
  } = derived;

  const statusIcon =
    statusKind === "error"
      ? AlertTriangle
      : statusKind === "ready"
        ? CheckCircle2
        : statusKind === "active"
          ? Loader2
          : Clock4;

  const detailsRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = detailsRef.current;
    if (!el) {
      return;
    }
    gsap.killTweensOf(el);
    if (detail) {
      gsap.set(el, { display: "block", height: "auto", opacity: 1 });
      return;
    }
    if (navigation) {
      gsap.set(el, { display: "none", height: 0, opacity: 0 });
      return;
    }
    if (expanded) {
      gsap.set(el, { display: "block" });
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: "auto",
          opacity: 1,
          duration: 0.25,
          ease: "power1.out",
          clearProps: "height",
        },
      );
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.16,
        ease: "power1.out",
        onComplete: () => {
          gsap.set(el, { display: "none" });
        },
      });
    }
  }, [detail, expanded, navigation]);

  const summary = (
    <>
      {!navigation && (
        <div
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border",
            statusKind === "error"
              ? "border-destructive/15 bg-destructive/[0.08] text-destructive"
              : statusKind === "ready"
                ? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400"
                : "border-primary/10 bg-primary/[0.07] text-primary",
          )}
        >
          <StatusIcon icon={statusIcon} spinning={isDownloading || isSaving} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-bold leading-tight">
          {job.filename}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {navigation ? (
            <span
              className={cn(
                "shrink-0 text-[10px] font-medium",
                headerStatusVariant === "destructive"
                  ? "text-destructive"
                  : headerStatusVariant === "default"
                    ? "text-primary"
                    : headerStatusVariant === "secondary"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground",
              )}
            >
              {headerStatusLabel}
            </span>
          ) : (
            <div
              className={cn(
                "pointer-events-none shrink-0 select-none rounded-full border px-1.5 py-px text-[9px] font-bold",
                headerStatusVariant === "destructive"
                  ? "border-destructive/40 bg-destructive/10 text-destructive dark:border-destructive/50"
                  : headerStatusVariant === "default"
                    ? "border-primary/30 bg-primary/10 text-primary dark:border-primary/40"
                    : headerStatusVariant === "secondary"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-50"
                      : "bg-muted text-muted-foreground",
              )}
            >
              {headerStatusLabel}
            </div>
          )}
          <span className="truncate text-[10px] font-medium text-muted-foreground">
            {derived.size.expectedBytes
              ? `~${formatBytes(derived.size.expectedBytes)}`
              : "Estimating size"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-muted-foreground">
        <span className="inline-flex min-w-[2ch] justify-end">{percent}</span>%
      </div>
    </>
  );

  if (detail) {
    return (
      <JobDetailView
        status={status}
        derived={derived}
        job={job}
        downloadJob={downloadJob}
        deleteJob={deleteJob}
        cancelJob={cancelJob}
        saveAsJob={saveAsJob}
      />
    );
  }

  return (
    <Card
      data-job-card
      className={cn(
        "mb-2 min-w-0 overflow-hidden rounded-[11px] p-0 text-left text-sm",
        navigation && "flex-row gap-0",
      )}
    >
      {navigation ? (
        <>
          <button
            className="group flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-accent/35 active:bg-accent/55"
            onClick={onToggle}
            aria-label={`Open details for ${job.filename}`}
          >
            {summary}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </button>
          <div className="flex shrink-0 items-center border-l border-border/70 px-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={saveAsJob}
              disabled={!isReady}
              aria-label={`Save ${job.filename}`}
              title={isReady ? "Save file" : "Available when ready"}
            >
              <DownloadIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={deleteJob}
              aria-label={`Delete ${job.filename}`}
              title="Delete download"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      ) : (
        <button
          className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-accent/35 active:bg-accent/55"
          onClick={onToggle}
          aria-label="Toggle download details"
        >
          {summary}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-snappy group-hover:text-foreground",
              expanded ? "rotate-180" : "",
            )}
          />
        </button>
      )}

      <div
        ref={detailsRef}
        className="space-y-3 overflow-hidden border-t border-border/70 bg-muted/25 px-3 pb-3 pt-3"
        style={{ display: expanded ? "block" : "none" }}
      >
        <div className="flex items-start justify-between w-full gap-2 min-w-0">
          <div className="flex flex-col min-w-0">
            {!detail && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="block mr-1 min-w-0 max-w-full truncate text-sm font-semibold">
                      {job.filename}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        navigator.clipboard?.writeText(job.filename)
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent>
                  <ScrollArea className="break-all max-h-60">
                    {job.filename}
                  </ScrollArea>
                </HoverCardContent>
              </HoverCard>
            )}
            <div className="text-[11px] text-muted-foreground min-w-0 max-w-full break-all">
              {new Date(job.createdAt!).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="w-full min-w-0">
          <Metadata
            metadata={{
              type: "stream",
              bitrate: job.bitrate,
              width: job.width,
              height: job.height,
            }}
          />
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-[12px] leading-tight space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Storage</span>
            <span className="text-muted-foreground">
              {derived.size.storedBytes !== undefined
                ? `${formatBytes(derived.size.storedBytes)} stored`
                : "Not stored yet"}
            </span>
            {derived.progress.total > 0 && (
              <span className="text-muted-foreground">
                • {derived.progress.done}/{derived.progress.total} fragments
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">
              Expected:{" "}
              {derived.size.expectedBytes !== undefined
                ? `~${formatBytes(derived.size.expectedBytes)}`
                : "Estimating"}
            </span>
            {derived.size.remainingBytes !== undefined && (
              <span className="text-muted-foreground">
                • {formatBytes(derived.size.remainingBytes)} remaining
              </span>
            )}
            {derived.size.availableBytes !== undefined && (
              <span className="text-muted-foreground">
                • Free {formatBytes(derived.size.availableBytes)}
              </span>
            )}
          </div>
        </div>

        <div className="w-full space-y-2">
          {isDownloading && <JobProgressView progress={progress} />}
          {isSaving && <JobSavingView saving={saving} />}
          {isError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 mt-px" />
              <div className="min-w-0">
                {status?.errorMessage ||
                  "Download failed. Please retry or delete."}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between w-full gap-2 pt-2">
          <div className="flex flex-wrap gap-2 mt-2">
            {status?.status === "init" && (
              <Button size="sm" variant="default" onClick={downloadJob}>
                <DownloadIcon className="w-4 h-4 mr-2" /> Download
              </Button>
            )}
            {isQueued && (
              <Button size="sm" variant="secondary" onClick={deleteJob}>
                <Trash2Icon className="w-4 h-4 mr-2" /> Remove
              </Button>
            )}
            {isDownloading && (
              <Button size="sm" variant="secondary" onClick={cancelJob}>
                <Trash2Icon className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}
            {["ready", "done", "saving"].includes(status?.status!) && (
              <Button
                size="sm"
                variant="default"
                onClick={saveAsJob}
                disabled={status?.status === "saving"}
              >
                <DownloadIcon className="w-4 h-4 mr-2" /> Save as
              </Button>
            )}
            {["error"].includes(status?.status ?? "") && (
              <Button size="sm" variant="default" onClick={downloadJob}>
                <DownloadIcon className="w-4 h-4 mr-2" /> Retry download
              </Button>
            )}
            {["ready", "done", "saving", "error"].includes(status?.status!) && (
              <Button size="sm" variant="ghost" onClick={deleteJob}>
                <Trash2Icon className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const JobDetailView = ({
  status,
  derived,
  job,
  downloadJob,
  deleteJob,
  cancelJob,
  saveAsJob,
}: {
  status: JobStatus | null;
  derived: import("./JobController").JobViewDerived;
  job: Job;
  downloadJob: () => void;
  deleteJob: () => void;
  cancelJob: () => void;
  saveAsJob: () => void;
}) => {
  const {
    percent,
    headerStatusLabel,
    headerStatusVariant,
    isError,
    isQueued,
    isDownloading,
    isSaving,
    isReady,
    saving,
    size,
  } = derived;

  const statusTone =
    headerStatusVariant === "destructive"
      ? "text-destructive"
      : headerStatusVariant === "secondary"
        ? "text-emerald-700 dark:text-emerald-400"
        : headerStatusVariant === "default"
          ? "text-primary"
          : "text-muted-foreground";

  const quality = [
    job.width && job.height ? `${job.width}×${job.height}` : undefined,
    job.bitrate ? `${(job.bitrate / 1024 / 1024).toFixed(1)} mbps` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const storageDetails = [
    size.expectedBytes !== undefined
      ? `~${formatBytes(size.expectedBytes)} expected`
      : undefined,
    size.remainingBytes !== undefined
      ? `${formatBytes(size.remainingBytes)} remaining`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const fragmentTotal = size.totalFragments ?? status?.total ?? 0;
  const fragmentDone =
    status?.status === "saving" || isReady
      ? fragmentTotal
      : (status?.done ?? 0);

  return (
    <div className="flex h-full min-w-0 flex-col gap-3">
      <DetailHeader
        title={job.filename}
        supporting={
          <span>
            {new Date(job.createdAt!).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        }
        aside={
          <div className={cn("flex items-center gap-1.5 pt-0.5", statusTone)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="text-[10px] font-bold">
              {headerStatusLabel}
              {(isDownloading || isSaving) && (
                <span className="ml-1 tabular-nums">{percent}%</span>
              )}
            </span>
          </div>
        }
      />

      {(isDownloading || isSaving) && (
        <div className="motion-list-entry px-1">
          <Progress
            value={percent}
            className="h-1.5 rounded-full bg-muted"
            aria-label={`${headerStatusLabel} progress`}
          />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-[9px] font-medium text-muted-foreground">
            <span className="truncate">
              {isSaving
                ? saving.message || "Preparing file"
                : `${derived.progress.done} of ${derived.progress.total} segments`}
            </span>
          </div>
        </div>
      )}

      <DetailPanel>
        <DetailRow label="Quality">
          <p className="truncate text-[11px] font-semibold">
            {quality || "Not available"}
          </p>
        </DetailRow>
        <DetailRow label="Storage">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold">
              {size.storedBytes !== undefined
                ? `${formatBytes(size.storedBytes)} stored`
                : "Not stored yet"}
            </p>
            {storageDetails && (
              <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                {storageDetails}
              </p>
            )}
          </div>
        </DetailRow>
        <DetailRow label="Segments">
          <p className="truncate text-[11px] font-semibold tabular-nums">
            {fragmentTotal > 0
              ? `${fragmentDone} of ${fragmentTotal}`
              : "Waiting to start"}
          </p>
        </DetailRow>
      </DetailPanel>

      {isError && (
        <div
          className="flex items-start gap-2 rounded-[10px] border border-destructive/30 bg-destructive/10 p-2.5 text-[10px] text-destructive"
          role="alert"
        >
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          <p className="min-w-0 leading-relaxed">
            {status?.errorMessage || "Download failed. Try again or delete it."}
          </p>
        </div>
      )}

      <div className="-mr-2 mt-auto flex min-h-8 items-center justify-between gap-2 pt-3">
        <div>
          {["ready", "done", "saving", "error"].includes(
            status?.status ?? "",
          ) && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={deleteJob}
            >
              <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
        <div className="grid min-w-[112px]">
          <div
            aria-hidden={status?.status !== "init"}
            data-active={status?.status === "init"}
            className={cn(
              "motion-state-layer col-start-1 row-start-1",
              status?.status === "init"
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-[0.96] opacity-0",
            )}
          >
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={downloadJob}
              disabled={status?.status !== "init"}
              tabIndex={status?.status === "init" ? undefined : -1}
            >
              <DownloadIcon className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          </div>
          <div
            aria-hidden={!isQueued}
            data-active={isQueued}
            className={cn(
              "motion-state-layer col-start-1 row-start-1",
              isQueued
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-[0.96] opacity-0",
            )}
          >
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={deleteJob}
              disabled={!isQueued}
              tabIndex={isQueued ? undefined : -1}
            >
              Remove
            </Button>
          </div>
          <div
            aria-hidden={!isDownloading}
            data-active={isDownloading}
            className={cn(
              "motion-state-layer col-start-1 row-start-1",
              isDownloading
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-[0.96] opacity-0",
            )}
          >
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={cancelJob}
              disabled={!isDownloading}
              tabIndex={isDownloading ? undefined : -1}
            >
              Cancel
            </Button>
          </div>
          <div
            aria-hidden={!isReady}
            data-active={isReady}
            className={cn(
              "motion-state-layer col-start-1 row-start-1",
              isReady
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-[0.96] opacity-0",
            )}
          >
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={saveAsJob}
              disabled={!isReady}
              tabIndex={isReady ? undefined : -1}
            >
              <DownloadIcon className="mr-1.5 h-3.5 w-3.5" />
              Save as
            </Button>
          </div>
          <div
            aria-hidden={!isError}
            data-active={isError}
            className={cn(
              "motion-state-layer col-start-1 row-start-1",
              isError
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-[0.96] opacity-0",
            )}
          >
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={downloadJob}
              disabled={!isError}
              tabIndex={isError ? undefined : -1}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobView;

const StatusIcon = ({
  icon: Icon,
  spinning,
}: {
  icon: React.ComponentType<{ className?: string }>;
  spinning?: boolean;
}) => <Icon className={cn("h-4 w-4", spinning && "animate-spin")} />;

type ProgressView = {
  percent: number;
  done: number;
  total: number;
};

const JobProgressView = ({ progress }: { progress: ProgressView }) => {
  const clampedPer = Math.max(0, Math.min(100, progress.percent));

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-muted-foreground inline-flex items-center gap-1 leading-tight">
          <span className="inline-block min-w-[3ch] text-right">
            {Math.round(clampedPer)}
          </span>
          %
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1 leading-tight">
          <span className="inline-block min-w-[3ch] text-right">
            {progress.done}
          </span>
          /
          <span className="inline-block min-w-[3ch] text-right">
            {progress.total}
          </span>
        </span>
      </div>
      <Progress value={clampedPer} className="h-2 rounded-full bg-muted" />
    </div>
  );
};

const JobSavingView = ({
  saving,
}: {
  saving: { percent: number; message: string };
}) => {
  const per = saving.percent;
  return (
    <div className="w-full">
      <div className="flex items-center mb-1 text-sm text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 mr-2 animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        {saving.message || "Saving..."}
      </div>
    </div>
  );
};
