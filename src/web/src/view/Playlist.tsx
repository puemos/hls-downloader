import { PlaylistStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { downloadsActions } from "@hls-downloader/core/lib/adapters/redux/slices";

const Playlist = (props: { id: string }) => {
  const status = useSelector<RootState, PlaylistStatus>(
    (state) => state.downloads.playlistsStatus[props.id]
  );
  const dispatch = useDispatch();
  function onSavePlaylistClick() {
    dispatch(
      downloadsActions.savePlaylistToFile({
        playlistID: props.id,
      })
    );
  }
  return status ? (
    <div className="Playlist">
      <span>
        <label htmlFor="download">Download progress:</label>
        <progress
          id="download"
          max="100"
          value={String((status.done / status.total) * 100)}
        ></progress>
        <span>
          {status.done} / {status.total}
        </span>
        <button onClick={onSavePlaylistClick}></button>
      </span>
    </div>
  ) : null;
};

export default Playlist;
