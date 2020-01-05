import * as R from "ramda";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Col } from "react-styled-flexboxgrid";
import styled from "styled-components";
import DownloadRow from "../components/DownloadRow";
import Table from "../components/Table";
import {
  chromeDownload,
  removeDownload
} from "../modules/downloads/action-creators";
import { downloadsItemsSelector } from "../modules/downloads/selectors";

const Body = styled(Col)`
  max-height: 400px;
  height: 300px;
  width: 100%;
`;

function DownloadsView() {
  const dispatch = useDispatch();
  const downloads = useSelector(downloadsItemsSelector);
  return (
    <Body>
      <Table
        items={R.reverse(Object.values(downloads))}
        renderRow={(downloadItem, idx) => (
          <DownloadRow
            key={downloadItem.id || idx}
            download={downloadItem}
            removeDownload={downloadId => dispatch(removeDownload(downloadId))}
            chromeDownload={download => dispatch(chromeDownload(download))}
          />
        )}
      />
    </Body>
  );
}

export default DownloadsView;
