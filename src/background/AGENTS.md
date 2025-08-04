# Background Package Guidelines

- Initializes the extension and wires services together.
- Keep business logic in `src/core`; background scripts should only coordinate
  use cases.
- Run `pnpm test:background` after making changes.
- Use two spaces for indentation in source and test files.
