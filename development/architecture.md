# Architecture

HLS Downloader follows the structure of [browser-extension-template](https://github.com/puemos/browser-extension-template) and is organized as a pnpm workspace. Each package under `src/` encapsulates a portion of the extension:

## Packages

- **assets** – extension manifest, icons and other static files
- **core** – domain logic and the Redux store shared across apps
- **background** – background scripts that sniff network requests and orchestrate downloads
- **popup** – the React UI shown when the toolbar button is clicked
- **design-system** – reusable React components and styles

## Core domain

The `core` package implements the business layer in a domain-driven style:

- **Entities** – classes representing HLS concepts such as `Fragment` and `Key`
- **Use cases** – single business actions composed from entities and services
- **Services** – interfaces for side effects like fetching or storage; concrete implementations live in other packages
- **Controllers** – RxJS epics that react to Redux actions and chain use cases
- **Store** – Redux Toolkit slices wired together and exposed through WebExt Redux so background and UI share state

## Apps

### Background

The background app wires browser APIs to the core store. Listeners watch for tab changes and network requests, dispatch actions, and fulfill services such as fetching segment data or writing files to disk.

### Popup

The popup app is a React single-page application built on the design system. It connects to the shared store to show detected playlists, manage downloads, and update settings.

## Build and testing

Build scripts compile each package with Vite, copy `assets`, and output to `dist/`. After a successful build, archives `extension-chrome.zip` and `extension-firefox.xpi` are generated. Unit tests run across packages with `pnpm test`; coverage is produced with `pnpm test:coverage`. `pnpm storybook` launches an isolated component explorer for the design system.

