import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { storageSlice } from "@hls-downloader/core/lib/store/slices";

export function useStorageInfo() {
  const dispatch = useDispatch();
  const storage = useSelector((state: RootState) => state.storage);

  const refreshStorage = useCallback(() => {
    dispatch(storageSlice.actions.refresh());
  }, [dispatch]);

  const startCleanup = useCallback(() => {
    dispatch(storageSlice.actions.startCleanup());
  }, [dispatch]);

  const resetCleanup = useCallback(() => {
    dispatch(storageSlice.actions.resetCleanupState());
  }, [dispatch]);

  useEffect(() => {
    if (!storage.lastUpdated && !storage.loading && !storage.error) {
      refreshStorage();
    }
  }, [storage.lastUpdated, storage.loading, storage.error, refreshStorage]);

  useEffect(() => {
    if (storage.cleanupStatus === "success") {
      const timer = setTimeout(() => resetCleanup(), 1800);
      return () => clearTimeout(timer);
    }
  }, [storage.cleanupStatus, resetCleanup]);

  return {
    storage,
    refreshStorage,
    startCleanup,
    resetCleanup,
  };
}
