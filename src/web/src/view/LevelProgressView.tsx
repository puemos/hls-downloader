import { Box, Progress } from "@chakra-ui/core";
import { LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";

export const LevelProgressView = (props: {
  status: LevelStatus;
  levelID: string;
}) => {
  return (
    <Box>
      <Box>
        <Progress
          value={(props.status.done / props.status.total) * 100}
        ></Progress>
      </Box>
      <Box textAlign="right">
        {props.status.done} / {props.status.total}
      </Box>
    </Box>
  );
};
