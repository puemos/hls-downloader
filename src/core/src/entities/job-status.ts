type JobStatusType =
  | "preparing"
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
  /** Bytes of the fragments downloaded so far. */
  downloadedBytes?: number;
  speed?: JobDownloadSpeed;
}

export interface JobDownloadSpeed {
  /** Undefined until the first measuring window has closed. */
  bytesPerSecond?: number;
  /** When the last fragment arrived, in ms since the epoch. */
  updatedAt: number;
  windowStartedAt: number;
  windowBytes: number;
}
