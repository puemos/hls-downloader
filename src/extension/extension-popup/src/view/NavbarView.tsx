import { Stack, Box } from "@chakra-ui/core";
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
      <Stack isInline spacing="2rem">
        <Box>
          <NavLink width="3rem" path="/" label="Home"></NavLink>
        </Box>
        <Box>
          <NavLink width="5.5rem" path="/downloads" label="Downloads"></NavLink>
        </Box>
        <Box>
          <NavLink width="3rem" path="/about" label="About"></NavLink>
        </Box>
      </Stack>
      <NavLink width="4rem" path="/settings" label="Settings"></NavLink>
    </Stack>
  );
}
