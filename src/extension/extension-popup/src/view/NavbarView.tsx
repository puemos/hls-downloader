import { Box, Button, Stack } from "@chakra-ui/core";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";

export function Navbar() {
  const { pathname } = useLocation();
  const { push } = useHistory();

  return (
    <Stack
      isInline
      bg="gray.900"
      p="1rem"
      pl="1rem"
      pr="1rem"
      justifyContent="space-between"
    >
      <Box>
        <Button
          variant="outline"
          onClick={() => push("/")}
          outline="0px"
          bg={
            pathname === "/" || pathname === "/index.html"
              ? "#5666f3"
              : "gray.900"
          }
        >
          Home
        </Button>
      </Box>

      <Box>
        <Button
          variant="outline"
          onClick={() => push("/settings")}
          leftIcon="settings"
          bg={pathname === "/settings" ? "#5666f3" : "gray.900"}
        >
          Settings
        </Button>
      </Box>
    </Stack>
  );
}
