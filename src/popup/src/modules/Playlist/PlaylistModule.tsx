import React from "react";
import PlaylistView from "./PlaylistView";
import usePlaylistController from "./PlaylistController";

const PlaylistModule = ({ id }: { id: string }) => {
  const { levels, status, downloadLevel: onDownloadLevelClick } = usePlaylistController({
    id,
  });

  return (
    <PlaylistView
      levels={levels}
      status={status}
      onDownloadLevelClick={onDownloadLevelClick}
    ></PlaylistView>
  );
};

export default PlaylistModule;
