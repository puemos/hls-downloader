import React, { useEffect, useMemo, useState } from "react";
import PlaylistView from "./PlaylistView";
import usePlaylistController from "./PlaylistController";
import { Level, Playlist } from "@hls-downloader/core/lib/entities";
import { useSelector } from "react-redux";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";

export function selectPreferredAudioLevel(
  audioLevels: Level[] = [],
  preferredLanguage?: string | null
): string | undefined {
  if (!audioLevels || audioLevels.length === 0) {
    return;
  }
  const normalized = preferredLanguage?.toLowerCase() ?? null;
  const score = (level: Level) => {
    const lang = level.language?.toLowerCase() ?? "";
    return {
      languageIndex:
        normalized && lang === normalized ? 0 : Number.POSITIVE_INFINITY,
      isDefault: level.isDefault ? 0 : 1,
      isAuto: level.autoSelect ? 0 : 1,
    };
  };

  return [...audioLevels].sort((a, b) => {
    const aScore = score(a);
    const bScore = score(b);
    if (aScore.languageIndex !== bScore.languageIndex) {
      return aScore.languageIndex - bScore.languageIndex;
    }
    if (aScore.isDefault !== bScore.isDefault) {
      return aScore.isDefault - bScore.isDefault;
    }
    if (aScore.isAuto !== bScore.isAuto) {
      return aScore.isAuto - bScore.isAuto;
    }
    return 0;
  })[0]?.id;
}

const PlaylistModule = ({
  id,
  onBack,
}: {
  id: string;
  onBack?: () => void;
}) => {
  const {
    levels,
    status,
    downloadLevel,
    inspections,
    preferences,
    preferredAudioLanguage,
    setAudioPreference,
    setSubtitlePreference,
    inspectLevel,
  } = usePlaylistController({
    id,
  });

  const playlist = useSelector<RootState, Playlist | null>(
    (state) => state.playlists.playlists[id] ?? null
  );
  const [videoId, setVideoId] = useState<string>();
  const [audioId, setAudioId] = useState<string>();
  const [subtitleId, setSubtitleId] = useState<string>("");
  const levelDurations = useSelector(
    (state: RootState) => state.levels.durations
  );

  const videoLevels = useMemo(
    () => levels.filter((l) => l.type === "stream"),
    [levels]
  );
  const audioLevels = useMemo(
    () => levels.filter((l) => l.type === "audio"),
    [levels]
  );
  const subtitleLevels = useMemo(
    () => levels.filter((l) => l.type === "subtitle"),
    [levels]
  );

  const selectedVideo = useMemo(
    () => videoLevels.find((v) => v.id === videoId),
    [videoLevels, videoId]
  );

  const filteredAudioLevels = useMemo(() => {
    if (!selectedVideo?.audioGroupId) {
      return audioLevels;
    }
    return audioLevels.filter((a) => a.groupId === selectedVideo.audioGroupId);
  }, [audioLevels, selectedVideo]);

  const selectedAudio = useMemo(
    () => filteredAudioLevels.find((a) => a.id === audioId),
    [filteredAudioLevels, audioId]
  );

  const storedAudioId = preferences.audioSelections[id];
  const storedSubtitleId = preferences.subtitleSelections[id];

  useEffect(() => {
    if (videoLevels.length > 0) {
      if (!videoId || !videoLevels.some((v) => v.id === videoId)) {
        setVideoId(videoLevels[0].id);
      }
    } else if (videoId) {
      setVideoId(undefined);
    }
  }, [videoLevels, videoId]);

  useEffect(() => {
    if (filteredAudioLevels.length > 0) {
      const preferredExisting =
        storedAudioId && filteredAudioLevels.some((a) => a.id === storedAudioId)
          ? storedAudioId
          : undefined;
      const currentValid =
        audioId && filteredAudioLevels.some((a) => a.id === audioId)
          ? audioId
          : undefined;
      const nextAudioId =
        preferredExisting ??
        currentValid ??
        selectPreferredAudioLevel(filteredAudioLevels, preferredAudioLanguage);

      if (nextAudioId && nextAudioId !== audioId) {
        setAudioId(nextAudioId);
      }
      if (nextAudioId && preferredExisting !== nextAudioId) {
        setAudioPreference(nextAudioId);
      }
    } else if (audioId) {
      setAudioId(undefined);
    }
  }, [
    filteredAudioLevels,
    audioId,
    storedAudioId,
    preferredAudioLanguage,
    setAudioPreference,
  ]);

  useEffect(() => {
    if (subtitleLevels.length > 0) {
      if (
        storedSubtitleId !== undefined &&
        subtitleLevels.some((s) => s.id === storedSubtitleId)
      ) {
        setSubtitleId(storedSubtitleId);
      } else if (storedSubtitleId === "") {
        setSubtitleId("");
      } else if (
        subtitleId &&
        !subtitleLevels.some((s) => s.id === subtitleId)
      ) {
        setSubtitleId("");
      }
    } else if (subtitleId) {
      setSubtitleId("");
    }
  }, [subtitleLevels, subtitleId, storedSubtitleId]);

  useEffect(() => {
    if (
      videoId &&
      inspections.status[videoId] !== "pending" &&
      !inspections.inspections[videoId]
    ) {
      inspectLevel(videoId);
    }
  }, [videoId, inspectLevel, inspections]);

  useEffect(() => {
    if (
      audioId &&
      inspections.status[audioId] !== "pending" &&
      !inspections.inspections[audioId]
    ) {
      inspectLevel(audioId);
    }
  }, [audioId, inspectLevel, inspections]);

  const requiresVideo = videoLevels.length > 0;
  const requiresAudio =
    selectedVideo?.audioGroupId && filteredAudioLevels.length > 0;
  const hasMedia = requiresVideo || requiresAudio;

  const estimate = useMemo(() => {
    const storedDuration = videoId ? levelDurations[videoId] ?? null : null;
    const duration = storedDuration ?? null;
    if (!duration || !selectedVideo) {
      return undefined;
    }
    const videoBitrate = selectedVideo.bitrate ?? 0;
    const audioBitrate =
      (selectedAudio?.bitrate ?? 0) ||
      (filteredAudioLevels.length > 0 ? 128_000 : 0);
    const totalBitrate = videoBitrate + audioBitrate;
    if (totalBitrate === 0) {
      return undefined;
    }
    const expectedBytes = (totalBitrate / 8) * duration;
    return {
      expectedBytes,
      storedBytes: undefined,
      totalFragments: undefined,
    };
  }, [
    levelDurations,
    videoId,
    selectedVideo,
    selectedAudio,
    filteredAudioLevels.length,
  ]);

  const selectedInspections = {
    video: videoId ? inspections.inspections[videoId] : null,
    audio: audioId ? inspections.inspections[audioId] : null,
  };
  const inspectionErrors = {
    video: videoId ? inspections.errors[videoId] : null,
    audio: audioId ? inspections.errors[audioId] : null,
  };

  const inspectionPending =
    (videoId && inspections.status[videoId] === "pending") ||
    (audioId && inspections.status[audioId] === "pending");

  const encryptionSummaries = [
    selectedVideo
      ? {
          label: "Video",
          supported: selectedInspections.video?.supported ?? true,
          method: selectedInspections.video?.method ?? null,
          keyUris: selectedInspections.video?.keyUris ?? [],
          pending: inspections.status[videoId ?? ""] === "pending",
          message:
            inspectionErrors.video ??
            selectedInspections.video?.message ??
            (selectedInspections.video?.method
              ? `${selectedInspections.video.method} encryption detected`
              : undefined),
        }
      : null,
    selectedAudio
      ? {
          label: "Audio",
          supported: selectedInspections.audio?.supported ?? true,
          method: selectedInspections.audio?.method ?? null,
          keyUris: selectedInspections.audio?.keyUris ?? [],
          pending: inspections.status[audioId ?? ""] === "pending",
          message:
            inspectionErrors.audio ??
            selectedInspections.audio?.message ??
            (selectedInspections.audio?.method
              ? `${selectedInspections.audio.method} encryption detected`
              : undefined),
        }
      : null,
  ].flatMap((entry) => (entry ? [entry] : []));

  const encryptionBlocked = encryptionSummaries.some(
    (summary) => summary.supported === false
  );

  const canDownload =
    hasMedia &&
    (!requiresVideo || !!videoId) &&
    (!requiresAudio || !!audioId) &&
    !encryptionBlocked &&
    !inspectionPending;

  function onDownload() {
    if (!canDownload) return;

    const primaryId = videoId ?? audioId!;
    downloadLevel(
      primaryId,
      requiresAudio ? audioId : undefined,
      subtitleId || undefined
    );
  }

  function handleSelectAudio(id: string) {
    setAudioId(id);
    setAudioPreference(id);
  }

  function handleSelectSubtitle(id: string) {
    setSubtitleId(id);
    setSubtitlePreference(id);
  }

  return (
    <PlaylistView
      onBack={onBack}
      playlist={playlist}
      videoLevels={videoLevels}
      audioLevels={filteredAudioLevels}
      subtitleLevels={subtitleLevels}
      selectedVideoId={videoId}
      selectedAudioId={audioId}
      selectedSubtitleId={subtitleId}
      onSelectVideo={setVideoId}
      onSelectAudio={handleSelectAudio}
      onSelectSubtitle={handleSelectSubtitle}
      onDownload={onDownload}
      canDownload={canDownload}
      status={status}
      encryptionSummaries={encryptionSummaries}
      inspectionPending={inspectionPending}
      encryptionBlocked={encryptionBlocked}
      estimate={estimate}
    ></PlaylistView>
  );
};

export default PlaylistModule;
