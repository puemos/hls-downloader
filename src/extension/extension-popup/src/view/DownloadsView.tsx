import { Stack } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { Job } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useSelector } from "react-redux";
import { EmptyState } from "./EmptyState";
import { JobView } from "./JobView";

const DownloadsView = () => {
  const jobs = useSelector<RootState, (Job | null)[]>((state) =>
    Object.values(state.jobs.jobs)
  );
  jobs.sort((a, b) => b!.createdAt - a!.createdAt);

  return (
    <Stack spacing="1rem" pl="1rem" pr="0rem" pb="2rem">
      {jobs.length === 0 && (
        <EmptyState caption="You don't have any downloads" />
      )}
      {jobs.map((job) => (
        <Stack>
          <JobView job={job!} />
        </Stack>
      ))}
    </Stack>
  );
};

export default DownloadsView;
