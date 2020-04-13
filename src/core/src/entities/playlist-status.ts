export interface PlaylistStatus {
  status: "downloading" | "done" | "merging" | "init";
  total: number;
  done: number;
}
