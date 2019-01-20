import * as R from "ramda";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import DownloadRow from "../../components/DownloadRow";
import Table from "../../components/Table";
import {
  removeDownload,
  chromeDownload
} from "../../modules/downloads/action-creators";
import { downloadsItemsSelector } from "../../modules/downloads/selectors";

const Body = styled(Col)`
  background-color: ${props => props.theme.colors.white};
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

class DownloadsView extends Component {
  render() {
    const { downloads, removeDownload, chromeDownload } = this.props;
    return (
      <Body>
        <Table
          items={R.reverse(Object.values(downloads))}
          renderRow={downloadItem => (
            <DownloadRow
              key={downloadItem.id}
              download={downloadItem}
              removeDownload={removeDownload}
              chromeDownload={chromeDownload}
            />
          )}
        />
      </Body>
    );
  }
}

const mapStateToProps = state => ({
  downloads: downloadsItemsSelector(state)
});
const mapDispatchToProps = dispatch => ({
  removeDownload: downloadId => dispatch(removeDownload(downloadId)),
  chromeDownload: download => dispatch(chromeDownload(download))
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DownloadsView);
