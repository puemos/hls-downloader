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
  CheckCircle2,
  Clock4,
} from "lucide-react";
import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Metadata } from "../../components/Metadata";

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
        }
      );
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.2,
        ease: "power1.in",
        onComplete: () => {
          gsap.set(el, { display: "none" });
        },
      });
    }
  }, [expanded]);

  return (
    <Card
      data-job-card
      className="mb-2 text-left text-sm min-w-0 overflow-hidden"
    >
      <button
        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors"
        onClick={onToggle}
        aria-label="Toggle download details"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            expanded ? "rotate-180" : ""
          )}
        />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="truncate font-semibold text-sm">{job.filename}</div>
          <div
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium border pointer-events-none select-none",
              headerStatusVariant === "destructive"
                ? "bg-destructive/10 text-destructive border-destructive/40 dark:border-destructive/50"
                : headerStatusVariant === "default"
                ? "bg-primary/10 text-primary border-primary/30 dark:border-primary/40"
                : headerStatusVariant === "secondary"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-50 dark:border-emerald-800"
                : "bg-muted text-muted-foreground"
            )}
          >
            {headerStatusLabel}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <StatusIcon
              icon={statusIcon}
              spinning={isDownloading || isSaving}
            />
            <span className="inline-flex min-w-[2ch] justify-end">
              {percent}
            </span>
            %
          </span>
        </div>
      </button>

      <div
        ref={detailsRef}
        className="px-3 pb-3 space-y-3 overflow-hidden"
        style={{ display: expanded ? "block" : "none" }}
      >
        <div className="flex items-start justify-between w-full gap-2 min-w-0">
          <div className="flex flex-col min-w-0">
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
                    onClick={() => navigator.clipboard?.writeText(job.filename)}
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

export default JobView;

const StatusIcon = ({
  icon: Icon,
  spinning,
}: {
  icon: React.ComponentType<{ className?: string }>;
  spinning?: boolean;
}) => (
  <Icon
    className={cn(
      "h-4 w-4",
      spinning ? "animate-spin text-primary" : "text-muted-foreground"
    )}
  />
);

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
