import React from "react";
import DownloadsView from "./DownloadsView";
import useDownloadsController from "./DownloadsController";
import { useStorageInfo } from "../../hooks/useStorageInfo";

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
  const { storage, startCleanup, refreshStorage } = useStorageInfo();

  return (
    <DownloadsView
      currentJobId={currentJobId}
      setCurrentJobId={setCurrentJobId}
      filter={filter}
      setFilter={setFilter}
      jobs={jobs}
      hasJobs={hasJobs}
      showFilterInput={showFilterInput}
      storage={storage}
      onCleanup={startCleanup}
      onRefreshStorage={refreshStorage}
    ></DownloadsView>
  );
};

export default DownloadsModule;
