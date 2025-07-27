# Repository Guidelines

This repository contains the **HLS Downloader** browser extension.
Follow these rules when automating changes or submitting pull requests.

## Architecture

* The project is a pnpm workspace with several packages under `src/`:
  * `core` – shared business logic implemented in TypeScript.  Source files live in `src/core/src` and compile to `src/core/lib`.
  * `background` – initializes the extension store and wires services such as `IndexedDBFS`, `FetchLoader` and `M3u8Parser`.
  * `popup` – React user interface for interacting with playlists and downloads.
  * `design-system` – UI component library consumed by the popup.
  * `assets` – extension manifest and icons.

* Business logic should reside in `src/core`.  Implement new features as
  `use-cases` under `src/core/src/use-cases` and orchestrate them through epics
  in `src/core/src/controllers`.  Background scripts should only coordinate these
  functions.

* UI components should come from `src/design-system/src` to keep styling
  consistent across the extension.

## Build Verification

* Run `sh ./scripts/build.sh` from the project root.  This installs
  dependencies, builds each package and produces the bundled extension in
  `dist/` as well as `extension-chrome.zip` and `extension-firefox.xpi`.
* There is no test suite; a successful build is required before opening a PR.

## Development

* Use `sh ./scripts/dev.sh` for watch mode.  It runs the background, popup, core
  and design-system builds in parallel while copying assets to `dist/`.

## Artifact Handling

* Do **not** commit `dist/`, `extension-chrome.zip`, `extension-firefox.xpi` or
  `extension-archive.zip`; they are temporary build outputs listed in
  `.gitignore`.
* Remove generated artifacts after verifying a build to keep the working tree
  clean.

## Coding Style

* Use two spaces for indentation in all `.ts`, `.tsx`, `.js` and `.json` files.
* Do not edit `src/core/lib` directly – it is generated from the TypeScript
  sources in `src/core/src`.

## Documentation

* If build steps or project layout change, update `README.md` so new
  contributors can build the project without surprises.
* Additional contribution policies are documented in `CONTRIBUTING.md` and the
  code of conduct.
