import { Box, Stack, Text } from "@chakra-ui/core";
import React from "react";

export function EmptyState(props: { caption: string }) {
  return (
    <Stack
      position="absolute"
      transform="translate(-50%, -25%);"
      top="50%"
      left="50%"
      align="center"
    >
      <Box>
        <img width="185px" src="/empty.svg" alt="empty" />
      </Box>
      <Box width="100%">
        <Text
          width="100%"
          color="gray.400"
          textAlign="center"
          mt="1rem"
          fontSize="0.8rem"
        >
          {props.caption}
        </Text>
      </Box>
    </Stack>
  );
}
