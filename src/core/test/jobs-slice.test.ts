import { describe, it, expect, beforeEach } from "vitest";
import { jobsSlice } from "../src/store/slices/jobs-slice";
import {
  createTestJob,
  createTestFragment,
  createTestJobStatus,
} from "./test-utils";
import { Job, Fragment, Key } from "../src/entities";

describe("jobs slice", () => {
  // Initial state tests
  describe("initial state", () => {
    it("should have empty jobs and jobsStatus objects", () => {
      const initialState = jobsSlice.reducer(undefined, { type: "unknown" });
      expect(initialState.jobs).toEqual({});
      expect(initialState.jobsStatus).toEqual({});
    });
  });

  // Add job tests
  describe("add action", () => {
    it("should add a job to the state", () => {
      const job = createTestJob({ id: "job1" });
      const initialState = { jobs: {}, jobsStatus: {} };

      const nextState = jobsSlice.reducer(
        initialState,
        jobsSlice.actions.add({ job }),
      );

      expect(nextState.jobs["job1"]).toEqual(job);
      expect(nextState.jobsStatus["job1"]).toBeDefined();
      expect(nextState.jobsStatus["job1"]?.status).toBe("downloading");
      expect(nextState.jobsStatus["job1"]?.total).toBe(
        job.videoFragments.length + job.audioFragments.length,
      );
      expect(nextState.jobsStatus["job1"]?.done).toBe(0);
    });

    it("should set correct total when job has both video and audio fragments", () => {
      const videoFragments = [
        createTestFragment({ index: 0 }),
        createTestFragment({ index: 1 }),
      ];
      const audioFragments = [
        createTestFragment({ index: 0 }),
        createTestFragment({ index: 1 }),
        createTestFragment({ index: 2 }),
      ];

      const job = createTestJob({
        id: "job1",
        videoFragments,
        audioFragments,
      });

      const initialState = { jobs: {}, jobsStatus: {} };

      const nextState = jobsSlice.reducer(
        initialState,
        jobsSlice.actions.add({ job }),
      );

      expect(nextState.jobsStatus["job1"]?.total).toBe(5); // 2 video + 3 audio
    });
  });

  // Increment download status tests
  describe("incDownloadStatus action", () => {
    it("should increment the done count for a job", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {
          job1: {
            status: "downloading" as const,
            total: 5,
            done: 2,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.incDownloadStatus({ jobId: "job1" }),
      );

      expect(state.jobsStatus["job1"]?.done).toBe(3);
    });
  });

  // Finish download tests
  describe("finishDownload action", () => {
    it("should mark the job as ready", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {
          job1: {
            status: "downloading" as const,
            total: 5,
            done: 5,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.finishDownload({ jobId: "job1" }),
      );

      expect(state.jobsStatus["job1"]?.status).toBe("ready");
      expect(state.jobsStatus["job1"]?.done).toBe(5);
    });
  });

  // Save as tests
  describe("saveAs action", () => {
    it("should mark the job as saving", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {
          job1: {
            status: "ready" as const,
            total: 5,
            done: 5,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.saveAs({ jobId: "job1" }),
      );

      expect(state.jobsStatus["job1"]?.status).toBe("saving");
    });
  });

  // Save as success tests
  describe("saveAsSuccess action", () => {
    it("should update the job link and mark as done", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {
          job1: {
            status: "saving" as const,
            total: 5,
            done: 5,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.saveAsSuccess({
          jobId: "job1",
          link: "file://test.mp4",
        }),
      );

      expect(state.jobs["job1"]?.link).toBe("file://test.mp4");
      expect(state.jobsStatus["job1"]?.status).toBe("done");
    });

    it("should work when link is undefined", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {
          job1: {
            status: "saving" as const,
            total: 5,
            done: 5,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.saveAsSuccess({ jobId: "job1" }),
      );

      expect(state.jobs["job1"]?.link).toBeUndefined();
      expect(state.jobsStatus["job1"]?.status).toBe("done");
    });
  });

  // Set save progress tests
  describe("setSaveProgress action", () => {
    it("should update the save progress and message", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {
          job1: {
            status: "saving" as const,
            total: 5,
            done: 5,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.setSaveProgress({
          jobId: "job1",
          progress: 75,
          message: "Preparing file",
        }),
      );

      expect(state.jobsStatus["job1"]?.saveProgress).toBe(75);
      expect(state.jobsStatus["job1"]?.saveMessage).toBe("Preparing file");
    });

    it("should handle missing jobStatus", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: { job1: job },
        jobsStatus: {},
      };

      // This shouldn't throw
      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.setSaveProgress({
          jobId: "job1",
          progress: 75,
          message: "Preparing file",
        }),
      );

      expect(state.jobsStatus["job1"]).toBeUndefined();
    });
  });

  // Delete success tests
  describe("deleteSuccess action", () => {
    it("should remove the job and its status", () => {
      const job = createTestJob({ id: "job1" });
      let state = {
        jobs: {
          job1: job,
          job2: createTestJob({ id: "job2" }),
        },
        jobsStatus: {
          job1: {
            status: "done" as const,
            total: 5,
            done: 5,
          },
          job2: {
            status: "downloading" as const,
            total: 3,
            done: 1,
          },
        },
      };

      state = jobsSlice.reducer(
        state,
        jobsSlice.actions.deleteSuccess({ jobId: "job1" }),
      );

      expect(state.jobs["job1"]).toBeUndefined();
      expect(state.jobsStatus["job1"]).toBeUndefined();
      expect(state.jobs["job2"]).toBeDefined();
      expect(state.jobsStatus["job2"]).toBeDefined();
    });
  });

  // Clear tests
  describe("clear action", () => {
    it("should reset the state to initial", () => {
      let state = {
        jobs: {
          job1: createTestJob({ id: "job1" }),
          job2: createTestJob({ id: "job2" }),
        },
        jobsStatus: {
          job1: {
            status: "done" as const,
            total: 5,
            done: 5,
          },
          job2: {
            status: "downloading" as const,
            total: 3,
            done: 1,
          },
        },
      };

      state = jobsSlice.reducer(state, jobsSlice.actions.clear());

      expect(state.jobs).toEqual({});
      expect(state.jobsStatus).toEqual({});
    });
  });

  // Edge cases and no-op actions
  describe("edge cases", () => {
    it("should ignore download action", () => {
      const initialState = { jobs: {}, jobsStatus: {} };
      const nextState = jobsSlice.reducer(
        initialState,
        jobsSlice.actions.download({ jobId: "job1" }),
      );
      expect(nextState).toEqual(initialState);
    });

    it("should ignore cancel action", () => {
      const initialState = { jobs: {}, jobsStatus: {} };
      const nextState = jobsSlice.reducer(
        initialState,
        jobsSlice.actions.cancel({ jobId: "job1" }),
      );
      expect(nextState).toEqual(initialState);
    });

    it("should ignore delete action", () => {
      const initialState = { jobs: {}, jobsStatus: {} };
      const nextState = jobsSlice.reducer(
        initialState,
        jobsSlice.actions.delete({ jobId: "job1" }),
      );
      expect(nextState).toEqual(initialState);
    });
  });
});
