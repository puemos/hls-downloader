import React, { useEffect, useMemo, useState } from "react";
import PlaylistView from "./PlaylistView";
import usePlaylistController from "./PlaylistController";

const PlaylistModule = ({ id }: { id: string }) => {
  const { levels, status, downloadLevel } = usePlaylistController({
    id,
  });

  const [videoId, setVideoId] = useState<string>();
  const [audioId, setAudioId] = useState<string>();
  const [subtitleId, setSubtitleId] = useState<string>("");

  const videoLevels = useMemo(
    () => levels.filter((l) => l.type === "stream"),
    [levels],
  );
  const audioLevels = useMemo(
    () => levels.filter((l) => l.type === "audio"),
    [levels],
  );
  const subtitleLevels = useMemo(
    () => levels.filter((l) => l.type === "subtitle"),
    [levels],
  );

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
    if (audioLevels.length > 0) {
      if (!audioId || !audioLevels.some((a) => a.id === audioId)) {
        setAudioId(audioLevels[0].id);
      }
    } else if (audioId) {
      setAudioId(undefined);
    }
  }, [audioLevels, audioId]);

  useEffect(() => {
    if (subtitleLevels.length > 0) {
      if (!subtitleId || !subtitleLevels.some((s) => s.id === subtitleId)) {
        setSubtitleId("");
      }
    } else if (subtitleId) {
      setSubtitleId("");
    }
  }, [subtitleLevels, subtitleId]);

  const requiresVideo = videoLevels.length > 0;
  const requiresAudio = audioLevels.length > 0;
  const hasMedia = requiresVideo || requiresAudio;

  const canDownload =
    hasMedia && (!requiresVideo || !!videoId) && (!requiresAudio || !!audioId);

  function onDownload() {
    if (!canDownload) return;

    const primaryId = videoId ?? audioId!;
    downloadLevel(
      primaryId,
      requiresAudio ? audioId : undefined,
      subtitleId || undefined,
    );
  }

  return (
    <PlaylistView
      videoLevels={videoLevels}
      audioLevels={audioLevels}
      subtitleLevels={subtitleLevels}
      selectedVideoId={videoId}
      selectedAudioId={audioId}
      selectedSubtitleId={subtitleId}
      onSelectVideo={setVideoId}
      onSelectAudio={setAudioId}
      onSelectSubtitle={setSubtitleId}
      onDownload={onDownload}
      canDownload={canDownload}
      status={status}
    ></PlaylistView>
  );
};

export default PlaylistModule;
