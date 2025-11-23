import React from "react";
import DownloadsView from "./DownloadsView";
import useDownloadsController from "./DownloadsController";

const DownloadsModule = () => {
  const {
    jobs,
    currentJobId,
    filter,
    setCurrentJobId,
    setFilter,
    hasJobs,
    showFilterInput,
  } = useDownloadsController();

  return (
    <DownloadsView
      currentJobId={currentJobId}
      setCurrentJobId={setCurrentJobId}
      filter={filter}
      setFilter={setFilter}
      jobs={jobs}
      hasJobs={hasJobs}
      showFilterInput={showFilterInput}
    ></DownloadsView>
  );
};

export default DownloadsModule;
