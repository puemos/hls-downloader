import { all, fork } from "redux-saga/effects";
import saveAsSaga from "../../background/saveAs";
import downloadsSaga from "../downloads/sagas";
import setBadgeSaga from "../downloads/sagas/setBadge";

export default function* rootSaga() {
  yield all([fork(downloadsSaga), fork(saveAsSaga), fork(setBadgeSaga)]);
}
