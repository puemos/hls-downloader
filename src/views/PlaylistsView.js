import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router";
import PlaylistRow from "../components/PlaylistRow";
import Table from "../components/Table";
import { currentRequestSelector } from "../modules/requests/selectors";
import { downloadPlaylist } from "../modules/downloads/action-creators";
import { Body } from "./Body";

function sortByResulotion() {
  return (a, b) =>
    a.RESOLUTION.width * a.RESOLUTION.height -
    b.RESOLUTION.width * b.RESOLUTION.height;
}

function PlaylistsView(props) {
  const dispatch = useDispatch();
  const history = useHistory();
  const { id } = useParams();
  const request = useSelector(currentRequestSelector(id));
  const items = request.manifest ? request.manifest.playlists : [];
  items.sort(sortByResulotion);
  return (
    <Body>
      <Table
        items={items}
        renderRow={(playlistItem, idx) => (
          <PlaylistRow
            key={playlistItem.id || idx}
            playlist={playlistItem}
            onDownloadClick={() => {
              history.push("/downloads");
              dispatch(downloadPlaylist({ playlist: playlistItem, request }));
            }}
          />
        )}
      />
    </Body>
  );
}

export default PlaylistsView;
