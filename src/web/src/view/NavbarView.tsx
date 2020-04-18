import { Box, Button, Stack } from "@chakra-ui/core";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";

export function Navbar() {
  const { pathname } = useLocation();
  const { push } = useHistory();

  return (
    <Stack isInline bg="gray.800" p="1rem" pl="2rem" pr="2rem">
      <Box>
        <Button
          onClick={() => push("/")}
          outline="0px"
          leftIcon="search"
          bg={pathname === "/" ? "pink.800" : "gray.800"}
        >
          Home
        </Button>
      </Box>

      <Box>
        <Button
          onClick={() => push("/settings")}
          leftIcon="settings"
          bg={pathname === "/settings" ? "pink.800" : "gray.800"}
        >
          Settings
        </Button>
      </Box>
    </Stack>
  );
}
