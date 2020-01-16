import { takeEvery } from "redux-saga/effects";
import { urlnameParse } from "../components/RequestRow/urlnameParse";
import sanitize from "sanitize-filename";

function getFilename(download) {
  return `${download.tab.title} - ${urlnameParse(download.title)}.mp4`;
}

function saveAs(action) {
  const { payload: download } = action;

  chrome.downloads.download({
    url: download.link,
    filename: sanitize(getFilename(download))
  });
}

export default function* saveAsSaga() {
  yield takeEvery("CHROME_DOWNLOAD", saveAs);
}
