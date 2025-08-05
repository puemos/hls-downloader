# Build

1. Clone the repo.
2. Install Node.js (v18 or newer) and `pnpm` 10 or later.
3. Run `pnpm install` to install all dependencies.
4. Run `pnpm build` and verify it completes without errors.
5. Built files will be in `./dist/`.
6. The packaged archives will be `./extension-chrome.zip` and
   `./extension-firefox.xpi`.
7. Load `dist/` as an unpacked extension in your browser to test the build
   locally.

## Tests

Run `pnpm test` to execute unit tests across all packages. For a combined
coverage report and badge, run `pnpm test:coverage`.

## Development

Run `pnpm dev` to start watchers for all packages while you edit. The compiled
extension will appear in `dist/` as you work. To preview popup and
design-system components, run `pnpm storybook`.

See [architecture](architecture.md) for an overview of the project structure.
