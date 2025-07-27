import React, { useMemo, useState } from "react";
import PlaylistView from "./PlaylistView";
import usePlaylistController from "./PlaylistController";

const PlaylistModule = ({ id }: { id: string }) => {
  const { levels, status, downloadLevel } = usePlaylistController({
    id,
  });

  const [videoId, setVideoId] = useState<string>();
  const [audioId, setAudioId] = useState<string>();

  const videoLevels = useMemo(
    () => levels.filter((l) => l.type !== "audio"),
    [levels],
  );
  const audioLevels = useMemo(
    () => levels.filter((l) => l.type === "audio"),
    [levels],
  );

  const requiresVideo = videoLevels.length > 0;
  const requiresAudio = audioLevels.length > 0;

  const canDownload =
    (!requiresVideo || !!videoId) && (!requiresAudio || !!audioId);

  function onDownload() {
    if (!canDownload) return;

    const primaryId = videoId ?? audioId!;
    downloadLevel(primaryId, requiresAudio ? audioId : undefined);
  }

  return (
    <PlaylistView
      videoLevels={videoLevels}
      audioLevels={audioLevels}
      selectedVideoId={videoId}
      selectedAudioId={audioId}
      onSelectVideo={setVideoId}
      onSelectAudio={setAudioId}
      onDownload={onDownload}
      canDownload={canDownload}
      status={status}
    ></PlaylistView>
  );
};

export default PlaylistModule;
