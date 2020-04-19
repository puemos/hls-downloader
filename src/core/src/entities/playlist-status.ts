type PlaylistStatusType = "init" | "ready" | "error" | "fetching";

export interface PlaylistStatus {
  status: PlaylistStatusType;
}
