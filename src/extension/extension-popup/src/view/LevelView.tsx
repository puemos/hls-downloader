import { Box, Grid, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Level } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { DownloadIcon } from "@chakra-ui/icons";
import { LevelMetadata } from "./LevelMetadata";

export const LevelView = (props: { level: Level }) => {
  const dispatch = useDispatch();
  const { push } = useHistory();

  function onDownloadLevelClick() {
    dispatch(levelsSlice.actions.download({ levelID: props.level.id }));
    push("/downloads");
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
        <LevelMetadata level={props.level} />
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
        <IconButton
          icon={<DownloadIcon />}
          aria-label="download"
          onClick={onDownloadLevelClick}
        />
      </Stack>
    </Grid>
  );
};
