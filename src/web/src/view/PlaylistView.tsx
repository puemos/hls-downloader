import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import {
  PlaylistStatus,
  Level,
} from "@hls-downloader/core/lib/entities";
import React from "react";
import { useSelector } from "react-redux";
import { LevelView } from "./LevelView";

const PlaylistView = (props: { id: string }) => {
  const status = useSelector<RootState, PlaylistStatus | null>(
    (state) => state.playlists.playlistsStatus[props.id]
  );
  const levels = useSelector<RootState, (Level | null)[]>((state) =>
    Object.values(state.levels.levels)
  );
  const playlistLevels = levels
    .filter(Boolean)
    .filter((l) => l?.playlistID === props.id);
  if (!status) {
    return null;
  }
  if (status.status === "fetching") {
    return <div className="Playlist">Fetching</div>;
  }
  if (status.status === "ready") {
    return (
      <div className="Playlist">
        <div>
          {playlistLevels.map((level) => (
            <LevelView level={level!} />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default PlaylistView;
