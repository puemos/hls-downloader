import { Box, Progress, Text, Stack } from "@chakra-ui/core";
import { LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";

export const LevelProgressView = (props: {
  status: LevelStatus;
  levelID: string;
}) => {
  return (
    <Stack>
      <Box>
        <Progress max={props.status.total} value={props.status.done}></Progress>
      </Box>
      <Box textAlign="right">
        <Text>
          {props.status.done} / {props.status.total}
        </Text>
      </Box>
    </Stack>
  );
};
