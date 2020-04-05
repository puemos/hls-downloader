import {
  DOWNLOAD_PLAYLIST,
  DOWNLOAD_FAILED,
  DOWNLOAD_FINISHED,
  DOWNLOAD_CHANGE,
  ADD_DOWNLOAD,
  CANCEL_DOWNLOAD,
  REMOVE_DOWNLOAD,
  CHROME_DOWNLOAD
} from "./action-types";

export function downloadPlaylist({ playlist, request }) {
  return { type: DOWNLOAD_PLAYLIST, payload: { playlist, request } };
}

export function addDownload(download) {
  return { type: ADD_DOWNLOAD, payload: download };
}
export function cancelDownload(downloadId) {
  return { type: CANCEL_DOWNLOAD, payload: downloadId };
}
export function removeDownload(downloadId) {
  return { type: REMOVE_DOWNLOAD, payload: downloadId };
}
export function chromeDownload(download) {
  return { type: CHROME_DOWNLOAD, payload: download };
}
export function downloadFinished(download) {
  return { type: DOWNLOAD_FINISHED, payload: download };
}
export function downloadFailed(message) {
  return { type: DOWNLOAD_FAILED, message };
}
export function downloadChange(download) {
  return { type: DOWNLOAD_CHANGE, payload: download };
}
