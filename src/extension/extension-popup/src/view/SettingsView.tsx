import { Box, Flex, IconButton, Stack, Switch, Text } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const SettingsView = () => {
  const dispatch = useDispatch();
  const concurrency = useSelector<RootState, number>(
    (state) => state.config.concurrency
  );
  const autoSave = useSelector<RootState, boolean>(
    (state) => state.config.autoSave
  );
  function onConcurrencyIncrease() {
    dispatch(
      configSlice.actions.setConcurrency({
        concurrency: concurrency + 1,
      })
    );
  }
  function onConcurrencyDecrease() {
    dispatch(
      configSlice.actions.setConcurrency({
        concurrency: Math.max(1, concurrency - 1),
      })
    );
  }
  function onAutoSave() {
    dispatch(
      configSlice.actions.setAutosave({
        autoSave: !autoSave,
      })
    );
  }

  return (
    <Stack spacing="1rem" p="1rem" pr="0rem">
      <Stack
        p="1rem"
        rounded="lg"
        bg="gray.800"
        isInline
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            Concurrency
          </Text>
        </Box>
        <Stack isInline>
          <IconButton
            icon="add"
            size="sm"
            aria-label="increase concurrency"
            onClick={onConcurrencyIncrease}
            bg="#5666f3"
          ></IconButton>
          <Flex
            width="2rem"
            height="2rem"
            pl="16px"
            pr="16px"
            justifyContent="center"
            alignItems="center"
            borderRadius="0.25rem"
            bg="gray.600"
          >
            <Text fontSize="md" fontWeight="semibold">
              {concurrency}
            </Text>
          </Flex>
          <IconButton
            size="sm"
            icon="minus"
            aria-label="decrease concurrency"
            bg="#5666f3"
            onClick={onConcurrencyDecrease}
          ></IconButton>
        </Stack>
      </Stack>
      <Stack
        p="1rem"
        rounded="lg"
        bg="gray.800"
        isInline
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            Enable auto save?
          </Text>
        </Box>
        <Box>
          <Switch onClick={onAutoSave} isChecked={autoSave} size="lg" />
        </Box>
      </Stack>
    </Stack>
  );
};

export default SettingsView;
