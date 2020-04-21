import { Box, Heading, Link, Stack } from "@chakra-ui/core";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";

export function Navbar() {
  const { pathname } = useLocation();
  const { push } = useHistory();

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
          <Link
            _hover={{
              textDecoration: "none",
            }}
            onClick={() => push("/")}
            color={
              pathname === "/" || pathname === "/index.html"
                ? "#adff7b"
                : "white"
            }
          >
            <Heading size="sm">Home</Heading>
          </Link>
        </Box>
        <Box>
          <Link
            _hover={{
              textDecoration: "none",
            }}
            onClick={() => push("/about")}
            color={pathname === "/about" ? "#adff7b" : "white"}
          >
            <Heading size="sm">About</Heading>
          </Link>
        </Box>
      </Stack>
      <Box>
        <Link
          _hover={{
            textDecoration: "none",
          }}
          onClick={() => push("/settings")}
          color={pathname === "/settings" ? "#adff7b" : "white"}
        >
          <Heading size="sm">Settings</Heading>
        </Link>
      </Box>
    </Stack>
  );
}
