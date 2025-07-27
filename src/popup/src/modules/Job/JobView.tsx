import { Job, JobStatus, LevelStatus } from "@hls-downloader/core/lib/entities";
import { Button, Progress, cn } from "@hls-downloader/design-system";
import { Trash2Icon, DownloadIcon } from "lucide-react";
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

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div
      className={cn(
        "flex flex-col mb-2 items-start gap-2 rounded-lg border p-3 text-left text-sm min-w-0 overflow-hidden"
      )}
    >
      <div className="flex flex-col items-start justify-between w-full mb-1 min-w-0">
        <div className="flex flex-col w-full min-w-0">
          <div className="mr-1 min-w-0 max-w-full" title={job.filename}>
            <span className="block">{truncateText(job.filename)}</span>
          </div>
          <div className="text-muted-foreground min-w-0 max-w-full">
            <span className="block">
              {truncateText(new Date(job.createdAt!).toLocaleString())}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full mb-1 min-w-0">
        <Metadata
          metadata={{
            type: "stream",
            bitrate: job.bitrate,
            width: job.width,
            height: job.height,
          }}
        />
      </div>

      <div className="w-full mb-2">
        {["downloading"].includes(status?.status!) && (
          <JobProgressView status={status!} />
        )}
        {["saving"].includes(status?.status!) && (
          <JobSavingView status={status!} />
        )}
      </div>

      <div className="flex flex-row-reverse w-full gap-2 flex-shrink-0">
        {["ready", "done", "saving"].includes(status?.status!) && (
          <Button size="sm" variant="secondary" onClick={saveAsJob}>
            <DownloadIcon className="w-4 h-4 mr-2" /> Save
          </Button>
        )}
        {["init"].includes(status?.status!) && (
          <Button size="sm" variant="secondary" onClick={downloadJob}>
            <DownloadIcon className="w-4 h-4 mr-2" /> Download
          </Button>
        )}
        {["downloading"].includes(status?.status!) && (
          <Button size="sm" variant="secondary" onClick={cancelJob}>
            <Trash2Icon className="w-4 h-4 mr-2" /> Cancel
          </Button>
        )}
        {["ready", "done", "saving"].includes(status?.status!) && (
          <Button size="sm" variant="secondary" onClick={deleteJob}>
            <Trash2Icon className="w-4 h-4 mr-2" /> Delete
          </Button>
        )}
      </div>
    </div>
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
        {status.saveMessage || "Processing..."}
      </div>
      <Progress value={per} className="h-2 rounded-full bg-muted" />
    </div>
  );
};
