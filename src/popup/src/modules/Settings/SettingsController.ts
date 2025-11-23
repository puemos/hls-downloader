import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/store/slices";
import { useDispatch, useSelector } from "react-redux";

interface ReturnType {
  concurrency: number;
  maxActiveDownloads: number;
  fetchAttempts: number;
  saveDialog: boolean;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onConcurrencyIncrease: () => void;
  onConcurrencyDecrease: () => void;
  onActiveDownloadsIncrease: () => void;
  onActiveDownloadsDecrease: () => void;
  onActiveDownloadsUnlimited: () => void;
  preferredAudioLanguage: string | null;
  onSetPreferredAudioLanguage: (lang: string | null) => void;
  activeDownloadsUnlimited: boolean;
}

const useSettingsController = (): ReturnType => {
  const dispatch = useDispatch();
  const concurrency = useSelector<RootState, number>(
    (state) => state.config.concurrency
  );
  const maxActiveDownloads = useSelector<RootState, number>(
    (state) => state.config.maxActiveDownloads ?? 0
  );
  const fetchAttempts = useSelector<RootState, number>(
    (state) => state.config.fetchAttempts
  );
  const saveDialog = useSelector<RootState, boolean>(
    (state) => state.config.saveDialog
  );
  const preferredAudioLanguage = useSelector<RootState, string | null>(
    (state) => state.config.preferredAudioLanguage
  );
  const activeDownloadsUnlimited = maxActiveDownloads === 0;

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
  function onActiveDownloadsIncrease() {
    dispatch(
      configSlice.actions.setMaxActiveDownloads({
        maxActiveDownloads:
          maxActiveDownloads === 0 ? 1 : Math.max(1, maxActiveDownloads + 1),
      })
    );
  }
  function onActiveDownloadsDecrease() {
    dispatch(
      configSlice.actions.setMaxActiveDownloads({
        maxActiveDownloads:
          maxActiveDownloads === 0 ? 1 : Math.max(1, maxActiveDownloads - 1),
      })
    );
  }
  function onActiveDownloadsUnlimited() {
    dispatch(
      configSlice.actions.setMaxActiveDownloads({
        maxActiveDownloads: 0,
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
  function onSetPreferredAudioLanguage(lang: string | null) {
    const normalized = (lang ?? "").trim();
    dispatch(
      configSlice.actions.setPreferredAudioLanguage({
        preferredAudioLanguage: normalized || null,
      })
    );
  }
  return {
    concurrency,
    maxActiveDownloads,
    activeDownloadsUnlimited,
    onConcurrencyIncrease,
    onConcurrencyDecrease,
    onActiveDownloadsIncrease,
    onActiveDownloadsDecrease,
    onActiveDownloadsUnlimited,
    fetchAttempts,
    saveDialog,
    onFetchAttemptsIncrease,
    onFetchAttemptsDecrease,
    onSaveDialogToggle,
    preferredAudioLanguage,
    onSetPreferredAudioLanguage,
  };
};

export default useSettingsController;
