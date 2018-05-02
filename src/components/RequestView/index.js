import React, { Component } from "react";
import { connect } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import elevationMixin from "../../mixin/elevation";
import { downloadPlaylist } from "../../modules/downloads/action-creators";
import { currentRequestSelector } from "../../modules/requests/selectors";
import colors from "../../theme/colors";
import PlaylistRow from "./PlaylistRow";
import { memoryHistory } from "../../modules/router/history";

const Body = styled(Col)`
  width: 100%;
  background-color: ${colors.white};
  max-height: 400px;
  height: 300px;

  overflow-y: scroll;
  ${elevationMixin(4)};
`;

class RequestView extends Component {
  render() {
    const { request, downloadPlaylist } = this.props;
    return (
      <Body>
        {request.manifest &&
          request.manifest.playlists.map((playlist, idx) => (
            <PlaylistRow
              key={playlist.uri}
              playlist={playlist}
              pos={idx + 1}
              onDownloadClick={() => {
                memoryHistory.push("/downloads");
                downloadPlaylist(playlist);
              }}
            />
          ))}
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
    downloadPlaylist: playlist => dispatch(downloadPlaylist(playlist))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RequestView);
