import { Grid, IconButton, Stack, Text } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { jobsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Job, JobStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { JobProgressView } from "./JobProgressView";

export const JobView = (props: { job: Job }) => {
  const status = useSelector<RootState, JobStatus | null>(
    (state) => state.jobs.jobsStatus[props.job.id]
  );
  const dispatch = useDispatch();

  function onDownloadJobClick() {
    dispatch(jobsSlice.actions.download({ jobId: props.job.id }));
  }
  function onDeleteClick() {
    dispatch(jobsSlice.actions.delete({ jobId: props.job.id }));
  }
  function onCancelClick() {
    dispatch(jobsSlice.actions.cancel({ jobId: props.job.id }));
  }
  function onSaveJobClick() {
    dispatch(jobsSlice.actions.saveAs({ jobId: props.job.id }));
  }
  return (
    <Grid
      rounded="lg"
      p="1rem"
      templateColumns="minmax(0, 1fr) 2.5rem"
      gap={6}
      bg="gray.800"
    >
      <Stack>
        <Stack isInline>
          <Text color="white" fontWeight="bold" isTruncated mr="4px">
            {props.job.filename}
          </Text>
          <Text width="9rem" color="gray.400" isTruncated>
            {"· "}
            {new Date(props.job.createdAt!).toLocaleString()}
          </Text>
        </Stack>
        <Grid gridTemplateColumns="1.3fr 1fr 1fr" gridTemplateRows="1fr">
          <Stack isInline spacing="0.4rem">
            <Text color="#99a3ff">Resolution</Text>
            {props.job.width && (
              <Text color="gray.400">
                {props.job.width}×{props.job.height}
              </Text>
            )}
          </Stack>
          <Stack isInline spacing="0.4rem">
            <Text color="#99a3ff">Bitrate</Text>
            <Text color="gray.400">{props.job.bitrate}</Text>
          </Stack>

          {["downloading", ""].includes(status?.status!)}
          <Stack isInline></Stack>
        </Grid>
        {["ready", "done", "saving", "downloading"].includes(
          status?.status!
        ) && (
          <Stack isInline spacing="0.4rem">
            <JobProgressView status={status!}></JobProgressView>
          </Stack>
        )}
      </Stack>
      <Stack justify="space-between">
        {["ready", "done", "saving"].includes(status?.status!) && (
          <IconButton
            aria-label="save"
            icon="download"
            isLoading={status?.status === "saving"}
            isDisabled={status?.status === "saving"}
            onClick={onSaveJobClick}
          />
        )}
        {["init"].includes(status?.status!) && (
          <IconButton
            icon="download"
            aria-label="download"
            onClick={onDownloadJobClick}
          />
        )}
        {["downloading"].includes(status?.status!) && (
          <IconButton
            icon="delete"
            aria-label="delete"
            onClick={onCancelClick}
          />
        )}
        {["ready", "done", "saving"].includes(status?.status!) && (
          <IconButton
            icon="delete"
            aria-label="delete"
            onClick={onDeleteClick}
          />
        )}
      </Stack>
    </Grid>
  );
};
