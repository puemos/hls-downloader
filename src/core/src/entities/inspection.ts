export interface LevelInspection {
  levelId: string;
  playlistId: string;
  method: string | null;
  keyUris: string[];
  iv?: string | null;
  supported: boolean;
  message?: string;
}
