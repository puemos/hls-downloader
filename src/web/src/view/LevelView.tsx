import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/core";
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
      boxShadow="md"
      rounded="lg"
      p="1rem"
      templateColumns="repeat(2, 1fr)"
      gap={6}
      bg="gray.900"
      height="8rem"
    >
      <Stack>
        <Box>
          <SimpleGrid columns={2}>
            <Text>Resolution</Text>
            <Text fontFamily="monospace" lineHeight="1.5rem" textAlign="right">
              {props.level.width}×{props.level.height}
            </Text>
          </SimpleGrid>
        </Box>
        <Box>
          <SimpleGrid columns={2}>
            <Text>Bitrate</Text>
            <Text fontFamily="monospace" lineHeight="1.5rem" textAlign="right">
              {props.level.bitrate}
            </Text>
          </SimpleGrid>
        </Box>
      </Stack>
      <Stack justify="space-between">
        <ButtonGroup>
          <Button>Copy</Button>
          {["ready", "done", "saving"].includes(status?.status!) && (
            <Button
              width="6rem"
              isDisabled={status?.status === "saving"}
              onClick={onSaveLevelClick}
            >
              Save
            </Button>
          )}

          {["init", "downloading"].includes(status?.status!) && (
            <Button
              width="6rem"
              isDisabled={status?.status === "downloading"}
              isLoading={status?.status === "downloading"}
              onClick={onDownloadLevelClick}
            >
              Download
            </Button>
          )}
        </ButtonGroup>

        <Box p="2px">
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
    </Grid>
  );
};
