import { all, fork } from "redux-saga/effects";
import downloadsSaga from "../downloads/sagas";

export default function* rootSaga() {
  yield all([fork(downloadsSaga)]);
}
