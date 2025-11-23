import React from "react";
import JobView from "./JobView";
import useJobController from "./JobController";
import { useState } from "react";

const JobModule = ({ id }: { id: string }) => {
  const { cancelJob, deleteJob, downloadJob, saveAsJob, status, job, derived } =
    useJobController({ id });
  const [expanded, setExpanded] = useState(false);

  return (
    <JobView
      job={job}
      derived={derived}
      cancelJob={cancelJob}
      deleteJob={deleteJob}
      downloadJob={downloadJob}
      saveAsJob={saveAsJob}
      status={status}
      expanded={expanded}
      onToggle={() => setExpanded((prev) => !prev)}
    ></JobView>
  );
};

export default JobModule;
