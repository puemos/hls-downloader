import type { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/store/slices";
import type { OutputContainer } from "@hls-downloader/core/lib/entities";
import { useDispatch, useSelector } from "react-redux";

interface ReturnType {
  concurrency: number;
  maxActiveDownloads: number;
  fetchAttempts: number;
  saveDialog: boolean;
  autoDeleteAfterSave: boolean;
  outputContainer: OutputContainer;
  onFetchAttemptsIncrease: () => void;
  onFetchAttemptsDecrease: () => void;
  onSaveDialogToggle: () => void;
  onAutoDeleteAfterSaveToggle: () => void;
  onConcurrencyIncrease: () => void;
  onConcurrencyDecrease: () => void;
  onActiveDownloadsIncrease: () => void;
  onActiveDownloadsDecrease: () => void;
  onActiveDownloadsUnlimited: () => void;
  preferredAudioLanguage: string | null;
  onSetPreferredAudioLanguage: (lang: string | null) => void;
  onSetOutputContainer: (outputContainer: OutputContainer) => void;
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
  const autoDeleteAfterSave = useSelector<RootState, boolean>(
    (state) => state.config.autoDeleteAfterSave
  );
  const outputContainer = useSelector<RootState, OutputContainer>(
    (state) => state.config.outputContainer ?? "mp4"
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
  function onAutoDeleteAfterSaveToggle() {
    dispatch(
      configSlice.actions.setAutoDeleteAfterSave({
        autoDeleteAfterSave: !autoDeleteAfterSave,
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
  function onSetOutputContainer(outputContainer: OutputContainer) {
    dispatch(
      configSlice.actions.setOutputContainer({
        outputContainer,
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
    autoDeleteAfterSave,
    outputContainer,
    onFetchAttemptsIncrease,
    onFetchAttemptsDecrease,
    onSaveDialogToggle,
    onAutoDeleteAfterSaveToggle,
    preferredAudioLanguage,
    onSetPreferredAudioLanguage,
    onSetOutputContainer,
  };
};

export default useSettingsController;
