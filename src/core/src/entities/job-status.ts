type JobStatusType = "downloading" | "done" | "ready" | "init" | "saving";

export interface JobStatus {
  status: JobStatusType;
  total: number;
  done: number;
}
