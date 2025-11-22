import { Job, JobStatus, LevelStatus } from "@hls-downloader/core/lib/entities";
import {
  Button,
  Card,
  Progress,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  ScrollArea,
  cn,
  Badge,
} from "@hls-downloader/design-system";
import {
  Trash2Icon,
  DownloadIcon,
  AlertTriangle,
  Loader2,
  Copy,
} from "lucide-react";
import React from "react";
import { Metadata } from "../../components/Metadata";

interface Props {
  job: Job | null;
  status: JobStatus | null;
  downloadJob: () => void;
  deleteJob: () => void;
  cancelJob: () => void;
  saveAsJob: () => void;
}

const JobView = ({
  status,
  job,
  downloadJob,
  deleteJob,
  cancelJob,
  saveAsJob,
}: Props) => {
  if (!job) {
    return null;
  }

  const isError = status?.status === "error";
  const isDownloading = status?.status === "downloading";
  const isSaving = status?.status === "saving";
  const isReady = ["ready", "done"].includes(status?.status ?? "");
  const footerHint =
    isSaving && status?.saveMessage
      ? status.saveMessage
      : isSaving
        ? ""
        : isDownloading
          ? "Downloading..."
          : isError
            ? "Error"
            : isReady
              ? "Ready to save"
              : "";
  const headerStatusLabel =
    status?.status === "init"
      ? "Pending"
      : status?.status === "downloading"
        ? "Downloading"
        : status?.status === "saving"
          ? "Saving"
          : status?.status === "done"
            ? "Completed"
            : status?.status === "ready"
              ? "Ready"
              : status?.status === "error"
                ? "Error"
                : "Queued";
  const headerStatusVariant =
    status?.status === "error"
      ? "destructive"
      : ["ready", "done"].includes(status?.status ?? "")
        ? "secondary"
        : "outline";

  return (
    <Card className="mb-2 items-start text-left text-sm min-w-0 overflow-hidden gap-3">
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
        <Badge variant={headerStatusVariant} className="shrink-0">
          {headerStatusLabel}
        </Badge>
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
        {isDownloading && <JobProgressView status={status!} />}
        {isSaving && <JobSavingView status={status!} />}
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

      <div className="flex flex-wrap items-center justify-between w-full gap-2 pt-2 border-t">
        <div className="text-xs text-muted-foreground">{footerHint}</div>
        <div className="flex flex-wrap gap-2">
          {status?.status === "init" && (
            <Button size="sm" variant="default" onClick={downloadJob}>
              <DownloadIcon className="w-4 h-4 mr-2" /> Download
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
    </Card>
  );
};

export default JobView;

const JobProgressView = ({ status }: { status: LevelStatus }) => {
  const done = status.done;
  const total = status.total;
  const per = Number((100 * done) / total);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-muted-foreground">{`${per.toFixed(0)}%`}</span>
        <span className="text-muted-foreground">{`${done} / ${total}`}</span>
      </div>
      <Progress value={per} className="h-2 rounded-full bg-muted" />
    </div>
  );
};

const JobSavingView = ({ status }: { status: JobStatus }) => {
  const per = Number(((status.saveProgress ?? 0) * 100).toFixed(0));
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
        {status.saveMessage || "Saving..."}
      </div>
    </div>
  );
};
