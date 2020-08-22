import {
  ColorModeProvider,
  CSSReset,
  theme,
  ThemeProvider,
} from "@chakra-ui/core";
import React from "react";

export function Theme(props: {
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <ColorModeProvider value="dark">
      <ThemeProvider
        theme={{
          ...theme,
          fonts: {
            ...theme.fonts,
            body: "'Arimo', sans-serif;",
            heading: "'Arimo', sans-serif;",
          },
          colors: {
            ...theme.colors,

            gray: {
              ...theme.colors.gray,
              800: "#303038",
              900: "#272730",
            },
          },
        }}
      >
        <CSSReset></CSSReset>
        {props.children}
      </ThemeProvider>
    </ColorModeProvider>
  );
}
