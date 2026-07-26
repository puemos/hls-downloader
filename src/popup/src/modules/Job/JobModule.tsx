import React from "react";
import JobView from "./JobView";
import useJobController from "./JobController";
import { useState } from "react";

const JobModule = ({
  id,
  detail = false,
  onOpen,
}: {
  id: string;
  detail?: boolean;
  onOpen?: () => void;
}) => {
  const { cancelJob, deleteJob, downloadJob, saveAsJob, status, job, derived } =
    useJobController({ id });
  const [expanded, setExpanded] = useState(false);

  const view = (
    <JobView
      job={job}
      derived={derived}
      cancelJob={cancelJob}
      deleteJob={deleteJob}
      downloadJob={downloadJob}
      saveAsJob={saveAsJob}
      status={status}
      expanded={detail || expanded}
      navigation={Boolean(onOpen)}
      detail={detail}
      onToggle={onOpen ?? (() => setExpanded((prev) => !prev))}
    ></JobView>
  );

  return detail ? <div className="min-h-0 flex-1">{view}</div> : view;
};

export default JobModule;
