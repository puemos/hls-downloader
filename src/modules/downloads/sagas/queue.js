import { buffers, channel } from "redux-saga";
import { all, call, fork, put, take } from "redux-saga/effects";

/**
 * creates a queue
 *
 * @param {GeneratorFunction} [handle=() => {}] request handler
 * @param {number} [concurrent=1] number of workers
 */
function* createQueue(handle = () => {}, concurrent = 1) {
  const addTaskChannel = yield call(channel, buffers.expanding());
  function* watchRequests() {
    try {
      // create a channel to queue incoming requests
      const runChannel = yield call(channel, buffers.expanding());

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
    while (true) {
      const payload = yield take(chan);
      yield handle(payload);
    }
  }

  return {
    watcher: watchRequests,
    addTaskChannel
  };
}

export default createQueue;
