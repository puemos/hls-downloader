import { Level, Playlist } from "../entities";
import { selectPreferredAudioLevel } from "./select-preferred-audio-level";

export interface BulkDownloadSelection {
  playlist: Playlist;
  video?: Level;
  audio?: Level;
  subtitle?: Level;
  error?: string;
}

interface Options {
  playlists: Playlist[];
  levels: Array<Level | null>;
  maxHeight?: number;
  preferredAudioLanguage?: string | null;
  audioSelections?: Record<string, string | undefined>;
  subtitleSelections?: Record<string, string | undefined>;
}

export function selectBulkDownloads({
  playlists,
  levels,
  maxHeight,
  preferredAudioLanguage,
  audioSelections = {},
  subtitleSelections = {},
}: Options): BulkDownloadSelection[] {
  // Track IDs and audio groups are scoped to their originating playlist.
  return [...new Map(playlists.map((p) => [p.id, p])).values()].map(
    (playlist) => {
      const tracks = levels.filter(
        (level): level is Level => level?.playlistID === playlist.id,
      );
      const videos = tracks.filter((level) => level.type === "stream");
      const allAudio = tracks.filter((level) => level.type === "audio");
      const video = videos
        .filter(
          (level) =>
            !maxHeight || (level.height != null && level.height <= maxHeight),
        )
        .sort(
          (a, b) =>
            (b.height ?? 0) - (a.height ?? 0) ||
            (b.bitrate ?? 0) - (a.bitrate ?? 0),
        )[0];
      const subtitle = tracks.find(
        (level) =>
          level.type === "subtitle" &&
          level.id === subtitleSelections[playlist.id],
      );
      if (!videos.length && allAudio.length) {
        const id = allAudio.some((a) => a.id === audioSelections[playlist.id])
          ? audioSelections[playlist.id]
          : selectPreferredAudioLevel(allAudio, preferredAudioLanguage);
        return { playlist, video: allAudio.find((a) => a.id === id), subtitle };
      }
      if (!video) {
        return {
          playlist,
          error: videos.length
            ? `No video quality at or below ${maxHeight}p. Choose a higher limit.`
            : "No downloadable tracks. Open this stream to check its source.",
        };
      }
      const audioTracks = video.audioGroupId
        ? allAudio.filter((a) => a.groupId === video.audioGroupId)
        : [];
      if (video.audioGroupId && allAudio.length && !audioTracks.length) {
        return {
          playlist,
          error: "No audio track matches this video quality.",
        };
      }
      const audioId = audioTracks.some(
        (a) => a.id === audioSelections[playlist.id],
      )
        ? audioSelections[playlist.id]
        : selectPreferredAudioLevel(audioTracks, preferredAudioLanguage);
      return {
        playlist,
        video,
        audio: audioTracks.find((a) => a.id === audioId),
        subtitle,
      };
    },
  );
}
