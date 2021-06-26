import { Stack, Box } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "./NavLink";

export function Navbar() {
  return (
    <Stack
      isInline
      bg="gray.800"
      p="1rem"
      pl="1rem"
      pr="1rem"
      justifyContent="space-between"
    >
      <Box>
        <NavLink path="/" label="Home"></NavLink>
      </Box>
      <Box>
        <NavLink path="/downloads" label="Downloads"></NavLink>
      </Box>
      <Box>
        <NavLink path="/direct" label="Direct"></NavLink>
      </Box>
      <Box>
        <NavLink path="/about" label="About"></NavLink>
      </Box>
      <Box>
        <NavLink path="/settings" label="Settings"></NavLink>
      </Box>
    </Stack>
  );
}
