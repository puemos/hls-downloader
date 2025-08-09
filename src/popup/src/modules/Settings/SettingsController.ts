import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/store/slices";
import { useDispatch, useSelector } from "react-redux";

interface ReturnType {
  concurrency: number;
  fetchAttempts: number;
  saveDialog: boolean;
  proxyEnabled: boolean;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onProxyToggle: () => void;
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
  const proxyEnabled = useSelector<RootState, boolean>(
    (state) => state.config.proxyEnabled
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
  function onProxyToggle() {
    dispatch(
      configSlice.actions.setProxyEnabled({
        proxyEnabled: !proxyEnabled,
      })
    );
  }
  return {
    concurrency,
    onConcurrencyIncrease,
    onConcurrencyDecrease,
    fetchAttempts,
    saveDialog,
    proxyEnabled,
    onFetchAttemptsIncrease,
    onFetchAttemptsDecrease,
    onSaveDialogToggle,
    onProxyToggle,
  };
};

export default useSettingsController;
