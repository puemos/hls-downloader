import { Box, Flex, IconButton, Input, Stack, Switch, Text } from "@chakra-ui/react";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

const value2infinity = 10000;

const SettingsView = () => {
  const dispatch = useDispatch();
  const concurrency = useSelector<RootState, number>(
    (state) => state.config.concurrency
  );
  const fetchAttempts = useSelector<RootState, number>(
    (state) => state.config.fetchAttempts
  );
  const saveDialog = useSelector<RootState, boolean>(
    (state) => state.config.saveDialog
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
  function onSaveDialogClick() {
    dispatch(
      configSlice.actions.setSaveDialog({
        saveDialog: !saveDialog,
      })
    );
  }
  function onFetchAttemptsIncrease() {
    if (fetchAttempts !== -1)
      dispatch(
        configSlice.actions.setFetchAttempts({
          fetchAttempts: fetchAttempts < value2infinity - 1 ? fetchAttempts + 1 : -1
        })
      );
  }
  function onFetchAttemptsDecrease() {
    dispatch(
      configSlice.actions.setFetchAttempts({
        fetchAttempts: fetchAttempts === -1 ? value2infinity - 1 : Math.max(1, fetchAttempts - 1),
      })
    );
  }
  function onFetchAttemptsChange(event: React.ChangeEvent<HTMLInputElement>) {
    const strFetchAttempts = event.currentTarget.value;
    let fetchAttempts = strFetchAttempts === "\u221E" ? Infinity : Math.floor(+strFetchAttempts);
    if (fetchAttempts >= value2infinity || fetchAttempts < 0)
      fetchAttempts = -1;
    if (fetchAttempts === 0)
      fetchAttempts = 1;
    if (fetchAttempts !== NaN)
    dispatch(
      configSlice.actions.setFetchAttempts({
        fetchAttempts: fetchAttempts
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
            Chunks Concurrency
          </Text>
        </Box>
        <Stack isInline>
          <IconButton
            icon={<AddIcon />}
            size="sm"
            aria-label="increase concurrency"
            onClick={onConcurrencyIncrease}
            bg="#5666f3"
          ></IconButton>
          <Flex
            width="4rem"
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
            icon={<MinusIcon />}
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
            Fetch Attempts
          </Text>
        </Box>
        <Stack isInline>
          <IconButton
            icon={<AddIcon />}
            size="sm"
            aria-label="increase fetch attempts"
            onClick={onFetchAttemptsIncrease}
            bg="#5666f3"
          ></IconButton>
          <Flex
            width="4rem"
            height="2rem"
            justifyContent="center"
            alignItems="center"
            borderRadius="0.25rem"
            bg="gray.600"
          >
            <Input
              pl="0px"
              pr="0px"
              value={fetchAttempts === -1 ? "∞" : fetchAttempts}
              onChange={onFetchAttemptsChange}
              variant="filled"
              textAlign="center"
            />
          </Flex>
          <IconButton
            size="sm"
            icon={<MinusIcon />}
            aria-label="decrease fetch attempts"
            bg="#5666f3"
            onClick={onFetchAttemptsDecrease}
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
            Enable save dialog?
          </Text>
        </Box>
        <Box>
          <Switch
            onClick={onSaveDialogClick}
            isChecked={saveDialog}
            size="lg"
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default SettingsView;
