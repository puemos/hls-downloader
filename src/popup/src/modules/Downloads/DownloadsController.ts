import { Job } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import { useState } from "react";
import { useSelector } from "react-redux";

interface ReturnType {
  jobs: Job[];
  currentJobId: string | undefined;
  filter: string;
  setCurrentJobId: (jobId?: string) => void;
  setFilter: (filter: string) => void;
}

const jobsFilter =
  (filter: string) =>
  (p: Job): boolean => {
    const filterLowerCase = filter.toLocaleLowerCase();
    if (filterLowerCase === "") {
      return true;
    }
    if (p.filename.toLocaleLowerCase().includes(filterLowerCase)) {
      return true;
    }
    return false;
  };

const useDownloadsController = (): ReturnType => {
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(
    undefined,
  );
  const [filter, setFilter] = useState("");

  const jobsRecord = useSelector<RootState, Record<string, Job | null>>(
    (state) => state.jobs.jobs,
  );

  const jobs = Object.values(jobsRecord)
    .flatMap((f) => (f ? [f] : []))
    .filter(jobsFilter(filter));

  jobs.sort((a, b) => b!.createdAt - a!.createdAt);

  return {
    jobs,
    currentJobId,
    setCurrentJobId,
    filter,
    setFilter,
  };
};

export default useDownloadsController;
