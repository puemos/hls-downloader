import { takeEvery } from "redux-saga/effects";

function getFilename(download) {
  return [download.title]
    .filter(Boolean)
    .map(str => String(str))
    .map(str => str.split("/"))
    .filter(str => str[str.length - 1])
    .map(str => str[str.length - 1])
    .map(str => str.split(".m3u8"))
    .map(str => str[0])
    .map(str => `${str}.mp4`)[0];
}

function saveAs(action) {
  const { payload: download } = action;
  chrome.downloads.download({
    url: download.link,
    filename: getFilename(download),
    saveAs: true
  });
}

export default function* saveAsSaga() {
  yield takeEvery("CHROME_DOWNLOAD", saveAs);
}
