import * as R from "ramda";
import { channel } from "redux-saga";
import { all, call, cancel, fork, put, race, take, takeEvery } from "redux-saga/effects";
import uuid from "uuid";
import { parsePlaylist } from "../../../background/Parser";
import { addDownload, downloadChange, downloadFinished } from "../action-creators";
import { DOWNLOAD_PLAYLIST, REMOVE_DOWNLOAD } from "../action-types";
import { BlobBuilder, getURIWithPlaylist, playlistFilename } from "../utils";
import createQueue from "./queue";

const segmentHandlerFactory = ({
  blobBuilder,
  getSegmentURI,
  playlistId,
  segmentsCount,
  allDoneChannel
}) =>
  function* segmentHandler({ uri, index }) {
    const res = yield call(fetch, getSegmentURI(uri));
    const blob = yield res.blob();

    blobBuilder.add(index, blob);

    yield put(
      downloadChange({
        id: playlistId,
        total: segmentsCount,
        finished: blobBuilder.count()
      })
    );
    if (R.equals(blobBuilder.count(), segmentsCount)) {
      yield allDoneChannel.put({ type: "DONE" });
    }
  };

function* downloadPlaylist(action) {
  const QUEUE_CONCURRENT = 2;

  const { payload: playlist } = action;
  const blobBuilder = BlobBuilder();
  try {
    const id = uuid.v4();
    const { segments } = yield call(parsePlaylist, playlist.uri);
    const getSegmentURI = getURIWithPlaylist(playlist.uri);

    yield put(
      addDownload({
        id,
        title: playlistFilename(playlist.uri),
        total: segments.length,
        finished: 0,
        created: Date.now()
      })
    );

    const allDoneChannel = yield call(channel);

    const { watcher, addTaskChannel } = yield createQueue(
      segmentHandlerFactory({
        blobBuilder,
        getSegmentURI,
        playlistId: id,
        segmentsCount: segments.length,
        allDoneChannel
      }),
      QUEUE_CONCURRENT
    );
    const watcherTask = yield fork(watcher);
    yield all(
      segments.map((segment, index) =>
        put(addTaskChannel, { payload: { uri: segment.uri, index } })
      )
    );
    while (true) {
      const { cancelDownload, allDone } = yield race({
        allDone: take(allDoneChannel),
        cancelDownload: take(REMOVE_DOWNLOAD)
      });
      console.log(cancelDownload, allDone);

      if (!R.isNil(cancelDownload) && R.propEq("payload", id, cancelDownload)) {
        yield cancel(watcherTask);
        return;
      }
      if (allDone) {
        yield cancel(watcherTask);
        const link = URL.createObjectURL(blobBuilder.build());
        yield put(downloadFinished({ id, link }));
        return;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function* downloadsSaga() {
  yield takeEvery(DOWNLOAD_PLAYLIST, downloadPlaylist);
}

export default downloadsSaga;
