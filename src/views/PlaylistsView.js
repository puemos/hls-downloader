import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import PlaylistRow from "../components/PlaylistRow";
import Table from "../components/Table";
import { currentRequestSelector } from "../modules/requests/selectors";
import { downloadPlaylist } from "../modules/downloads/action-creators";

const Body = styled(Col)`
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

function PlaylistsView(props) {
  const dispatch = useDispatch();
  const history = useHistory();
  const { id } = useParams();
  const request = useSelector(currentRequestSelector(id));
  return (
    <Body>
      <Table
        items={request.manifest ? request.manifest.playlists : []}
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
