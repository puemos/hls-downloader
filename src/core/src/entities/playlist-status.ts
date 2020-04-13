type PlaylistStatusType = "downloading" | "done" | "ready" | "init" | "saving";

export interface PlaylistStatus {
  status: PlaylistStatusType;
  total: number;
  done: number;
}
