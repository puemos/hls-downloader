import { Box, Progress, Text, Stack } from "@chakra-ui/core";
import { LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";

export const JobProgressView = (props: { status: LevelStatus }) => {
  const done = props.status.done;
  const total = props.status.total;
  const per = Number((100 * done) / total).toFixed(0);
  return (
    <Stack width="100%">
      <Stack isInline width="100%" justify="space-between">
        <Box textAlign="left">
          <Text color="gray.400">{`${per}%`}</Text>
        </Box>
        <Box textAlign="right">
          <Text color="gray.400">{`${done} / ${total}`}</Text>
        </Box>
      </Stack>
      <Box>
        <Progress
          max={total}
          value={done}
          hasStripe={done < total}
          isAnimated={done < total}
          borderRadius={5}
        ></Progress>
      </Box>
    </Stack>
  );
};
