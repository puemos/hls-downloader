import { takeEvery, call } from "redux-saga/effects";

function clearFileName(name) {
    return name.replace(/\s+/gi, '-').replace(/[^a-zA-Z0-9\-]/gi, '');
}

function getActiveTabTitle() {
    return new Promise((res, rej)=>{
        try {
            chrome.tabs.getSelected(({ title: tabTitle = null}) => {
                res(tabTitle);
            } )
        } catch (error) {
            rej(error)
        }

    })
}

function* getFilename(download) {
    const tabTitle = yield call(getActiveTabTitle)

    return clearFileName(tabTitle || 
        [download.title]
            .filter(Boolean)
            .map(str => String(str))
            .map(str => str.split("/"))
            .filter(str => str[str.length - 1])
            .map(str => str[str.length - 1])
            .map(str => str.split(".m3u8"))
            .map(str => str[0])
            .map(str => `${str}.mp4`)[0]);
}

function* saveAs(action) {
  const { payload: download } = action;
  chrome.downloads.download({
    url: download.link,
    filename: yield getFilename(download),
    saveAs: true
  });
}

export default function* saveAsSaga() {
  yield takeEvery("CHROME_DOWNLOAD", saveAs);
}
