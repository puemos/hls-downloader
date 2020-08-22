import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Job, JobStatus } from "../../../entities";

export type IJobsState = {
  jobs: Record<string, Job | null>;
  jobsStatus: Record<string, JobStatus | null>;
};

export type IDownloadJobPayload = {
  jobId: string;
};
export type IAddJobPayload = {
  job: Job;
};
export type IDeleteJobPayload = {
  jobId: string;
};

export type IFinishJobDownloadPayload = {
  jobId: string;
};
export type IIncJobDownloadStatusPayload = {
  jobId: string;
};
export type ISaveAsJobPayload = {
  jobId: string;
};
export type ISaveAsJobSuccessPayload = {
  jobId: string;
};
const initialJobsState: IJobsState = {
  jobsStatus: {},
  jobs: {},
};
export const jobsSlice = createSlice({
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
    cancel(state, action: PayloadAction<IDeleteJobPayload>) {},
    delete(state, action: PayloadAction<IDeleteJobPayload>) {},
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
      const jobStatus = state.jobsStatus[jobId]!;

      jobStatus.status = "done";
    },
  },
});
