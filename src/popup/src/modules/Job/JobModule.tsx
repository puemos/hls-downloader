import React from "react";
import JobView from "./JobView";
import useJobController from "./JobController";

const JobModule = ({ id }: { id: string }) => {
  const { cancelJob, deleteJob, downloadJob, saveAsJob, status, job } =
    useJobController({ id });

  return (
    <JobView
      job={job}
      cancelJob={cancelJob}
      deleteJob={deleteJob}
      downloadJob={downloadJob}
      saveAsJob={saveAsJob}
      status={status}
    ></JobView>
  );
};

export default JobModule;
