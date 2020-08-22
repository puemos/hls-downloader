import { Box, Grid, IconButton, Input, Stack, Text } from "@chakra-ui/core";
import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Level } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

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
        <IconButton
          icon="download"
          aria-label="download"
          onClick={onDownloadLevelClick}
        />
      </Stack>
    </Grid>
  );
};
