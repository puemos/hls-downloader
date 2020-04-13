import { PlaylistStatus } from "@hls-downloader/core/lib/adapters/redux/downloadsSlice";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/rootReducer";
import React from "react";
import { useSelector } from "react-redux";

const Playlist = (props: { id: string }) => {
  const status = useSelector<RootState, PlaylistStatus>(
    (state) => state.downloads.playlistsStatus[props.id]
  );

  return status ? (
    <span className="Playlist">
      <label htmlFor="download">Download progress:</label>
      <progress
        id="download"
        max="100"
        value={String((status.done / status.total) * 100)}
      ></progress>
      <span>
        {status.done} / {status.total}
      </span>
    </span>
  ) : null;
};

export default Playlist;
