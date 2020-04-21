import { Box, Grid, IconButton, Input, Stack, Text } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Level, LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { LevelProgressView } from "./LevelProgressView";

export const LevelView = (props: { level: Level }) => {
  const status = useSelector<RootState, LevelStatus | null>(
    (state) => state.levels.levelsStatus[props.level.id]
  );
  const dispatch = useDispatch();

  function onDownloadLevelClick() {
    dispatch(levelsSlice.actions.downloadLevel({ levelID: props.level.id }));
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
        <Stack isInline spacing="1rem">
          <Stack isInline spacing="0.2rem" width="24rem">
            <Text color="#99a3ff">Resolution</Text>
            {props.level.width && (
              <Text color="gray.400">
                {props.level.width}×{props.level.height}
              </Text>
            )}
          </Stack>
          <Stack isInline spacing="0.2rem">
            <Text color="#99a3ff">Bitrate</Text>
            <Text color="gray.400">{props.level.bitrate}</Text>
          </Stack>
          <Box width="100%">
            {["ready", "done", "saving", "downloading"].includes(
              status?.status!
            ) && (
              <LevelProgressView
                status={status!}
                levelID={props.level.id}
              ></LevelProgressView>
            )}
          </Box>
        </Stack>
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
            icon="arrow-forward"
            aria-label="download"
            isDisabled={status?.status === "downloading"}
            isLoading={status?.status === "downloading"}
            onClick={onDownloadLevelClick}
          />
        )}
      </Stack>
    </Grid>
  );
};
