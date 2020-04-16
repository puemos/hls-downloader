type PlaylistStatusType = "ready" | "error" | "fetching";

export interface PlaylistStatus {
  status: PlaylistStatusType;
}
