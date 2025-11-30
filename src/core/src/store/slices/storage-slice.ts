import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";
import {
  StorageBucketStats,
  StorageStats,
} from "../../use-cases/get-storage-stats";
import { StorageEstimate } from "../../services";

export type CleanupStatus = "idle" | "running" | "success" | "error";

export interface StorageState {
  loading: boolean;
  error?: string;
  buckets: Record<string, StorageBucketStats>;
  totalUsedBytes: number;
  availableBytes?: number;
  quotaBytes?: number;
  estimateSource: StorageEstimate["source"];
  nearQuota: boolean;
  subtitlesBytes?: number;
  lastUpdated?: number;
  cleanupStatus: CleanupStatus;
  cleanupError?: string;
}

export const initialStorageState: StorageState = {
  loading: false,
  buckets: {},
  totalUsedBytes: 0,
  estimateSource: "unknown",
  nearQuota: false,
  cleanupStatus: "idle",
};

interface StorageReducers {
  refresh: CaseReducer<StorageState, PayloadAction<void>>;
  refreshSuccess: CaseReducer<StorageState, PayloadAction<StorageStats>>;
  refreshFailure: CaseReducer<
    StorageState,
    PayloadAction<{ error: string }>
  >;
  startCleanup: CaseReducer<StorageState, PayloadAction<void>>;
  cleanupSuccess: CaseReducer<StorageState, PayloadAction<void>>;
  cleanupFailure: CaseReducer<
    StorageState,
    PayloadAction<{ error: string }>
  >;
  resetCleanupState: CaseReducer<StorageState, PayloadAction<void>>;
  [key: string]: CaseReducer<StorageState, PayloadAction<any>>;
}

export const storageSlice: Slice<StorageState, StorageReducers, "storage"> =
  createSlice({
    name: "storage",
    initialState: initialStorageState,
    reducers: {
      refresh(state) {
        state.loading = true;
        state.error = undefined;
      },
      refreshSuccess(state, action: PayloadAction<StorageStats>) {
        state.loading = false;
        state.error = undefined;
        state.lastUpdated = Date.now();
        state.availableBytes = action.payload.availableBytes;
        state.quotaBytes = action.payload.quotaBytes;
        state.estimateSource = action.payload.estimateSource;
        state.nearQuota = action.payload.nearQuota;
        state.totalUsedBytes = action.payload.totalUsedBytes;
        state.subtitlesBytes = action.payload.subtitlesBytes;
        state.buckets = action.payload.buckets.reduce(
          (acc, bucket) => {
            acc[bucket.id] = bucket;
            return acc;
          },
          {} as Record<string, StorageBucketStats>
        );
      },
      refreshFailure(state, action: PayloadAction<{ error: string }>) {
        state.loading = false;
        state.error = action.payload.error;
      },
      startCleanup(state) {
        state.cleanupStatus = "running";
        state.cleanupError = undefined;
      },
      cleanupSuccess(state) {
        state.cleanupStatus = "success";
        state.cleanupError = undefined;
        state.loading = false;
        state.lastUpdated = Date.now();
        state.totalUsedBytes = 0;
        state.availableBytes = state.quotaBytes ?? state.availableBytes;
        state.nearQuota = false;
        state.buckets = {};
      },
      cleanupFailure(state, action: PayloadAction<{ error: string }>) {
        state.cleanupStatus = "error";
        state.cleanupError = action.payload.error;
        state.loading = false;
      },
      resetCleanupState(state) {
        state.cleanupStatus = "idle";
        state.cleanupError = undefined;
      },
    },
  });
