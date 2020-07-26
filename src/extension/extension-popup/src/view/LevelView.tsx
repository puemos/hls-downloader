import { Box, Grid, IconButton, Input, Stack, Text } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Level, LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

export const LevelView = (props: { level: Level }) => {
  const status = useSelector<RootState, LevelStatus | null>(
    (state) => state.levels.levelsStatus[props.level.id]
  );
  const dispatch = useDispatch();

  function onDownloadLevelClick() {
    dispatch(levelsSlice.actions.downloadLevel({ levelID: props.level.id }));
  }

  function onCancelDownloadLevelClick() {
    dispatch(levelsSlice.actions.fetchLevelFragmentsDetailsCancel({ levelID: props.level.id }));
  }
  function onSaveLevelClick() {
    dispatch(levelsSlice.actions.saveLevelToFile({ levelID: props.level.id }));
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
        <Grid gridTemplateColumns="1.3fr 1fr 1fr" gridTemplateRows="1fr">
          <Stack isInline spacing="0.4rem">
            <Text color="#99a3ff">Resolution</Text>
            {props.level.width && (
              <Text color="gray.400">
                {props.level.width}×{props.level.height}
              </Text>
            )}
          </Stack>
          <Stack isInline spacing="0.4rem">
            <Text color="#99a3ff">Bitrate</Text>
            <Text color="gray.400">{props.level.bitrate}</Text>
          </Stack>
          {["ready", "done", "saving", "downloading"].includes(
            status?.status!
          ) && (
            <Stack isInline spacing="0.4rem">
              <Text color="#99a3ff">Progress</Text>
              <Text textAlign="right" color="gray.400">{`${Number(
                (100 * status!.done) / status!.total
              ).toFixed(0)}%`}</Text>
            </Stack>
          )}
        </Grid>
        <Box>
          <Input
            size="sm"
            borderColor="#99a3ff45"
            isReadOnly
            value={props.level.uri}
          />
        </Box>
      </Stack>
      <Stack justify="space-between">
        {["ready", "done", "saving"].includes(status?.status!) && (
          <IconButton
            aria-label="save"
            icon="download"
            isDisabled={status?.status === "saving"}
            onClick={onSaveLevelClick}
          />
        )}
        {["init", "downloading"].includes(status?.status!) && (
          <IconButton
            icon="download"
            aria-label="download"
            isDisabled={status?.status === "downloading"}
            isLoading={status?.status === "downloading"}
            onClick={onDownloadLevelClick}
          />
        )}
        {["downloading"].includes(status?.status!) && (
          <IconButton
            icon="delete"
            aria-label="canccel"
            onClick={onCancelDownloadLevelClick}
          />
        )}
      </Stack>
    </Grid>
  );
};
