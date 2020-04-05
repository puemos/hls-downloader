import * as R from "ramda";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import DownloadRow from "../components/DownloadRow";
import Table from "../components/Table";
import {
  chromeDownload,
  removeDownload
} from "../modules/downloads/action-creators";
import { downloadsItemsSelector } from "../modules/downloads/selectors";
import { Body } from "./Body";

function DownloadsView() {
  const dispatch = useDispatch();
  const downloads = useSelector(downloadsItemsSelector);
  return (
    <Body>
      <Table
        emptyMsg="You didin't download any video, yet :)"
        items={R.reverse(Object.values(downloads))}
        renderRow={(downloadItem, idx) => (
          <DownloadRow
            key={downloadItem.id || idx}
            download={downloadItem}
            removeDownload={() => dispatch(removeDownload(downloadItem.id))}
            chromeDownload={() => dispatch(chromeDownload(downloadItem))}
          />
        )}
      />
    </Body>
  );
}

export default DownloadsView;
