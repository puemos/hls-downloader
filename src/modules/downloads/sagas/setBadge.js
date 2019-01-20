import { takeEvery, select } from "redux-saga/effects";
import { requestsByActiveTabSelector } from "../../requests/selectors";
import { CHANGE_TAB } from "../../tabs/action-types";
import { ADD_REQUEST } from "../../requests/action-types";

function* onSetBadge() {
  const requests = yield select(requestsByActiveTabSelector);
  chrome.browserAction.setBadgeText({
    text: requests.length > 0 ? String(requests.length) : ""
  });
}

export default function* setBadgeSaga() {
  yield takeEvery([ADD_REQUEST, CHANGE_TAB], onSetBadge);
}
