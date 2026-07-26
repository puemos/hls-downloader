import type { OutputContainer } from "@hls-downloader/core/lib/entities";

export type DiskMuxRequest = {
  type: "mux";
  requestId: string;
  coreURL: string;
  wasmURL: string;
  storageKey: string;
  videoLength: number;
  audioLength: number;
  container: OutputContainer;
  subtitleText?: string;
  subtitleLanguage?: string;
  exportId: string;
};

export type DiskMuxProgress = {
  type: "progress";
  requestId: string;
  progress: number;
  message: string;
};

export type DiskMuxSuccess = {
  type: "success";
  requestId: string;
  exportId: string;
  mime: string;
  size: number;
  wasmMemoryBytes: number;
};

export type DiskMuxFailure = {
  type: "failure";
  requestId: string;
  message: string;
};

export type DiskMuxResponse = DiskMuxProgress | DiskMuxSuccess | DiskMuxFailure;
