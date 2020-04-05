import { buffers, channel } from "redux-saga";
import { all, call, fork, put, take, cancelled } from "redux-saga/effects";

/**
 * creates a queue
 *
 * @param {GeneratorFunction} [handle=() => {}] request handler
 * @param {number} [concurrent=1] number of workers
 */
function* createQueue(handle = () => {}, concurrent = 1) {
  const addTaskChannel = yield call(channel, buffers.expanding());
  // create a channel to queue incoming requests
  const runChannel = yield call(channel, buffers.expanding());
  function* watchRequests() {
    try {
      // create n worker 'threads'
      yield all(Array(concurrent).fill(fork(handleRequest, runChannel)));

      while (true) {
        const { payload } = yield take(addTaskChannel);
        yield put(runChannel, payload);
      }
    } finally {
    }
  }

  function* handleRequest(chan) {
    try {
      while (true) {
        const payload = yield take(chan);
        yield handle(payload);
      }
    } catch (error) {
      if (yield cancelled(watchRequests)) {
        addTaskChannel.close();
        runChannel.close();
      }
    }
  }

  return {
    watcher: watchRequests,
    addTaskChannel
  };
}

export default createQueue;
