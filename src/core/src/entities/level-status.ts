type LevelStatusType = "downloading" | "done" | "ready" | "init" | "saving";

export interface LevelStatus {
  status: LevelStatusType;
  total: number;
  done: number;
}
