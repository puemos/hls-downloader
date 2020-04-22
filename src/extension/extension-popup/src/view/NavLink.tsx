import { Box, Heading, Link, Stack } from "@chakra-ui/core";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";

export function NavLink(props: { path: string; label: string, width: string }) {
  const { pathname } = useLocation();
  const { push } = useHistory();
  return (
    <Stack width={props.width} spacing="2px">
      <Box w="100%">
        <Link
          _hover={{
            textDecoration: "none",
          }}
          onClick={() => push(props.path)}
        >
          <Heading size="sm">{props.label}</Heading>
        </Link>
      </Box>
      {pathname === props.path && <Box w="100%" bg="burlywood" h="2px"></Box>}
    </Stack>
  );
}
