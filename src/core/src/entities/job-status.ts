type JobStatusType =
  | "downloading"
  | "done"
  | "ready"
  | "init"
  | "saving"
  | "error"
  | "queued";

export interface JobStatus {
  status: JobStatusType;
  total: number;
  done: number;
  saveProgress?: number;
  saveMessage?: string;
  errorMessage?: string;
}
