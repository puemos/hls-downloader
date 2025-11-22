import { Job, JobStatus } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { jobsSlice } from "@hls-downloader/core/lib/store/slices";
import { useDispatch, useSelector } from "react-redux";

interface ReturnType {
  status: JobStatus | null;
  job: Job | null;
  downloadJob: () => void;
  deleteJob: () => void;
  cancelJob: () => void;
  saveAsJob: () => void;
}

const useJobController = ({ id }: { id: string }): ReturnType => {
  const dispatch = useDispatch();
  const status = useSelector<RootState, JobStatus | null>(
    (state) => state.jobs.jobsStatus[id],
  );
  const job = useSelector<RootState, Job | null>(
    (state) => state.jobs.jobs[id],
  );

  function downloadJob() {
    dispatch(jobsSlice.actions.download({ jobId: id }));
  }
  function deleteJob() {
    dispatch(jobsSlice.actions.delete({ jobId: id }));
  }
  function cancelJob() {
    dispatch(jobsSlice.actions.cancel({ jobId: id }));
  }
  function saveAsJob() {
    dispatch(jobsSlice.actions.saveAs({ jobId: id }));
  }
  return {
    status,
    job,
    downloadJob,
    deleteJob,
    cancelJob,
    saveAsJob,
  };
};

export default useJobController;
