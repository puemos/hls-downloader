# Core Package Guidelines

- Shared business logic and Redux state lives here.
- Edit TypeScript in `src/`; `lib/` is generated and must not be modified
  directly.
- Write unit tests for new features and run `pnpm test:core` before committing.
- Follow testing conventions described in `TEST.md`.
- Use two spaces for indentation in source and test files.
