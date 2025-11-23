import {
  createSlice,
  PayloadAction,
  Slice,
  CaseReducer,
} from "@reduxjs/toolkit";
import { Job, JobStatus } from "../../entities";

export interface IJobsState {
  jobs: Record<string, Job | null>;
  jobsStatus: Record<string, JobStatus | null>;
}

export interface IDownloadJobPayload {
  jobId: string;
}
export interface IAddJobPayload {
  job: Job;
}
export interface IDeleteJobPayload {
  jobId: string;
}

export interface IFinishJobDownloadPayload {
  jobId: string;
}
export interface IIncJobDownloadStatusPayload {
  jobId: string;
}
export interface IDownloadJobFailedPayload {
  jobId: string;
  message: string;
}
export interface ISaveAsJobPayload {
  jobId: string;
}
export interface ISaveAsJobSuccessPayload {
  jobId: string;
  link?: string;
}
export interface ISetSaveProgressPayload {
  jobId: string;
  progress: number;
  message: string;
}

interface IJobsReducers {
  download: CaseReducer<IJobsState, PayloadAction<IDownloadJobPayload>>;
  clear: CaseReducer<IJobsState, PayloadAction<any>>;
  add: CaseReducer<IJobsState, PayloadAction<IAddJobPayload>>;
  queue: CaseReducer<IJobsState, PayloadAction<IDownloadJobPayload>>;
  cancel: CaseReducer<IJobsState, PayloadAction<IDeleteJobPayload>>;
  delete: CaseReducer<IJobsState, PayloadAction<IDeleteJobPayload>>;
  deleteSuccess: CaseReducer<IJobsState, PayloadAction<IDeleteJobPayload>>;
  finishDownload: CaseReducer<
    IJobsState,
    PayloadAction<IFinishJobDownloadPayload>
  >;
  incDownloadStatus: CaseReducer<
    IJobsState,
    PayloadAction<IIncJobDownloadStatusPayload>
  >;
  downloadFailed: CaseReducer<
    IJobsState,
    PayloadAction<IDownloadJobFailedPayload>
  >;
  saveAs: CaseReducer<IJobsState, PayloadAction<ISaveAsJobPayload>>;
  saveAsSuccess: CaseReducer<
    IJobsState,
    PayloadAction<ISaveAsJobSuccessPayload>
  >;
  setSaveProgress: CaseReducer<
    IJobsState,
    PayloadAction<ISetSaveProgressPayload>
  >;
  [key: string]: CaseReducer<IJobsState, PayloadAction<any>>;
}

const initialJobsState: IJobsState = {
  jobsStatus: {},
  jobs: {},
};

export const jobsSlice: Slice<IJobsState, IJobsReducers, "jobs"> = createSlice({
  name: "jobs",
  initialState: initialJobsState,
  reducers: {
    download(state, action: PayloadAction<IDownloadJobPayload>) {
      const { jobId } = action.payload;
      const job = state.jobs[jobId];
      if (!job) {
        return;
      }
      const total = job.videoFragments.length + job.audioFragments.length;
      state.jobsStatus[jobId] = {
        ...(state.jobsStatus[jobId] ?? {
          total,
        }),
        status: "downloading",
        total,
        done: 0,
        saveProgress: 0,
        saveMessage: undefined,
        errorMessage: undefined,
      };
    },
    clear(state) {
      state.jobs = initialJobsState.jobs;
      state.jobsStatus = initialJobsState.jobsStatus;
    },
    add(state, action: PayloadAction<IAddJobPayload>) {
      const { job } = action.payload;
      state.jobs[job.id] = job;
      state.jobsStatus[job.id] = {
        done: 0,
        total: job.videoFragments.length + job.audioFragments.length,
        status: "queued",
        saveProgress: 0,
      };
    },
    queue(state, action: PayloadAction<IDownloadJobPayload>) {
      const { jobId } = action.payload;
      const job = state.jobs[jobId];
      if (!job) {
        return;
      }
      const total = job.videoFragments.length + job.audioFragments.length;
      state.jobsStatus[jobId] = {
        ...(state.jobsStatus[jobId] ?? {
          total,
        }),
        status: "queued",
        total,
        done: 0,
        saveProgress: 0,
        saveMessage: undefined,
        errorMessage: undefined,
      };
    },
    cancel(_state, _action: PayloadAction<IDeleteJobPayload>) {},
    delete(_state, _action: PayloadAction<IDeleteJobPayload>) {},
    deleteSuccess(state, action: PayloadAction<IDeleteJobPayload>) {
      const { jobId } = action.payload;
      delete state.jobs[jobId];
      delete state.jobsStatus[jobId];
    },
    finishDownload(state, action: PayloadAction<IFinishJobDownloadPayload>) {
      const { jobId: jobId } = action.payload;
      const jobStatus = state.jobsStatus[jobId]!;

      jobStatus.done = jobStatus.total;
      jobStatus.status = "ready";
    },
    downloadFailed(state, action: PayloadAction<IDownloadJobFailedPayload>) {
      const { jobId, message } = action.payload;
      const jobStatus = state.jobsStatus[jobId];
      if (jobStatus) {
        jobStatus.status = "error";
        jobStatus.errorMessage = message;
      }
    },
    incDownloadStatus(
      state,
      action: PayloadAction<IIncJobDownloadStatusPayload>
    ) {
      const { jobId: jobId } = action.payload;
      const jobStatus = state.jobsStatus[jobId]!;

      jobStatus.done++;
    },
    saveAs(state, action: PayloadAction<ISaveAsJobPayload>) {
      const { jobId } = action.payload;
      const jobStatus = state.jobsStatus[jobId]!;

      jobStatus.status = "saving";
    },
    saveAsSuccess(state, action: PayloadAction<ISaveAsJobSuccessPayload>) {
      const { jobId: jobId } = action.payload;
      const job = state.jobs[jobId]!;
      const jobStatus = state.jobsStatus[jobId]!;
      job.link = action.payload.link;
      jobStatus.status = "done";
    },
    setSaveProgress(state, action: PayloadAction<ISetSaveProgressPayload>) {
      const { jobId, progress, message } = action.payload;
      const jobStatus = state.jobsStatus[jobId]!;
      if (jobStatus) {
        jobStatus.saveProgress = progress;
        jobStatus.saveMessage = message;
      }
    },
  },
});
