import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/store/slices";
import { useDispatch, useSelector } from "react-redux";

interface ReturnType {
  concurrency: number;
  fetchAttempts: number;
  saveDialog: boolean;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onConcurrencyIncrease: () => void;
  onConcurrencyDecrease: () => void;
}

const useSettingsController = (): ReturnType => {
  const dispatch = useDispatch();
  const concurrency = useSelector<RootState, number>(
    (state) => state.config.concurrency
  );
  const fetchAttempts = useSelector<RootState, number>(
    (state) => state.config.fetchAttempts
  );
  const saveDialog = useSelector<RootState, boolean>(
    (state) => state.config.saveDialog
  );

  function onConcurrencyIncrease() {
    dispatch(
      configSlice.actions.setConcurrency({
        concurrency: concurrency + 1,
      })
    );
  }
  function onConcurrencyDecrease() {
    dispatch(
      configSlice.actions.setConcurrency({
        concurrency: Math.max(1, concurrency - 1),
      })
    );
  }
  function onFetchAttemptsIncrease() {
    dispatch(
      configSlice.actions.setFetchAttempts({
        fetchAttempts: fetchAttempts + 1,
      })
    );
  }
  function onFetchAttemptsDecrease() {
    dispatch(
      configSlice.actions.setFetchAttempts({
        fetchAttempts: Math.max(1, fetchAttempts - 1),
      })
    );
  }
  function onSaveDialogToggle() {
    dispatch(
      configSlice.actions.setSaveDialog({
        saveDialog: !saveDialog,
      })
    );
  }
  return {
    concurrency,
    onConcurrencyIncrease,
    onConcurrencyDecrease,
    fetchAttempts,
    saveDialog,
    onFetchAttemptsIncrease,
    onFetchAttemptsDecrease,
    onSaveDialogToggle,
  };
};

export default useSettingsController;
