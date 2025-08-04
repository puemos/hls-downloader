# Repository Guidelines

This repository contains the **HLS Downloader** browser extension.
Follow these rules when automating changes or submitting pull requests.

## Architecture

- The project is a pnpm workspace with several packages under `src/`:

  - `core` – shared business logic implemented in TypeScript. Source files live in `src/core/src` and compile to `src/core/lib`.
  - `background` – initializes the extension store and wires services such as `IndexedDBFS`, `FetchLoader` and `M3u8Parser`.
  - `popup` – React user interface for interacting with playlists and downloads.
  - `design-system` – UI component library consumed by the popup.
  - `assets` – extension manifest and icons.

- Business logic should reside in `src/core`. Implement new features as
  `use-cases` under `src/core/src/use-cases` and orchestrate them through epics
  in `src/core/src/controllers`. Background scripts should only coordinate these
  functions.

- UI components should come from `src/design-system/src` to keep styling
  consistent across the extension.

## Build and Test

- Install dependencies with `pnpm install` when necessary.
- Run `pnpm test` from the project root to execute package test suites.
- Run `pnpm run build` to build all packages and produce `dist/`,
  `extension-chrome.zip` and `extension-firefox.xpi`.
- Remove `dist/` and generated archives after verifying the build to keep the
  working tree clean.

## Development

- Use `pnpm run dev` for watch mode. It runs the background, popup, core and
  design-system builds in parallel while copying assets to `dist/`.

## Artifact Handling

- Do **not** commit `dist/`, `extension-chrome.zip`, `extension-firefox.xpi` or
  `extension-archive.zip`; they are temporary build outputs listed in
  `.gitignore`.

## Coding Style

- Use two spaces for indentation in all `.ts`, `.tsx`, `.js` and `.json` files.
- Do not edit `src/core/lib` directly – it is generated from the TypeScript
  sources in `src/core/src`.

## Commit Guidelines

- Follow `<type>: <summary>` format for commit messages, e.g.
  `feat: add download button`.
- Common types include `feat`, `fix`, `chore`, `test`, and `docs`.

## Documentation

- If build steps or project layout change, update `README.md` so new
  contributors can build the project without surprises.
- Additional contribution policies are documented in `CONTRIBUTING.md` and the
  code of conduct.
