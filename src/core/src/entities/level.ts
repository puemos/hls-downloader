export type LevelType = "stream" | "audio";

export type Level = {
  type: LevelType;
  id: string;
  playlistID: string;
  uri: string;
  width?: number;
  height?: number;
  bitrate?: number;
  fps?: number;
};
