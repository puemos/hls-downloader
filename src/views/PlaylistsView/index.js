import React, { Component } from "react";
import { connect } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import PlaylistRow from "../../components/PlaylistRow";
import Table from "../../components/Table";
import { downloadPlaylist } from "../../modules/downloads/action-creators";
import { currentRequestSelector } from "../../modules/requests/selectors";
import { memoryHistory } from "../../modules/router/history";

const Body = styled(Col)`
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

class RequestView extends Component {
  render() {
    const { request, downloadPlaylist } = this.props;
    return (
      <Body>
        <Table
          items={request.manifest ? request.manifest.playlists : []}
          renderRow={(playlistItem, idx) => (
            <PlaylistRow
              key={playlistItem.id || idx}
              playlist={playlistItem}
              onDownloadClick={() => {
                memoryHistory.push("/downloads");
                downloadPlaylist({ playlist: playlistItem, request });
              }}
            />
          )}
        />
      </Body>
    );
  }
}

const mapStateToProps = state => {
  return {
    request: currentRequestSelector(state)
  };
};
const mapDispatchToProps = dispatch => {
  return {
    downloadPlaylist: ({ playlist, request }) =>
      dispatch(downloadPlaylist({ playlist, request }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RequestView);
