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
export interface ISaveAsJobPayload {
  jobId: string;
}
export interface ISaveAsJobSuccessPayload {
  jobId: string;
  link?: string;
}

interface IJobsReducers {
  download: CaseReducer<IJobsState, PayloadAction<IDownloadJobPayload>>;
  clear: CaseReducer<IJobsState, PayloadAction<any>>;
  add: CaseReducer<IJobsState, PayloadAction<IAddJobPayload>>;
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
  saveAs: CaseReducer<IJobsState, PayloadAction<ISaveAsJobPayload>>;
  saveAsSuccess: CaseReducer<
    IJobsState,
    PayloadAction<ISaveAsJobSuccessPayload>
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
    download(_state, _action: PayloadAction<IDownloadJobPayload>) {},
    clear(state) {
      state.jobs = initialJobsState.jobs;
      state.jobsStatus = initialJobsState.jobsStatus;
    },
    add(state, action: PayloadAction<IAddJobPayload>) {
      const { job } = action.payload;
      state.jobs[job.id] = job;
      state.jobsStatus[job.id] = {
        done: 0,
        total: job.fragments.length,
        status: "downloading",
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
  },
});
