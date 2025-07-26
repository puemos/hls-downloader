# Repository Guidelines

This repository builds the **HLS Downloader** browser extension. When automating
changes or creating pull requests, keep the following points in mind:

## Build Verification

* Run `sh ./scripts/build.sh` from the project root. The script installs
  dependencies, compiles each package and bundles the final extension into
  `dist/` and `extension-archive.zip`.
* There is no separate test suite, so a successful build is the primary check.

## Development

* Use `sh ./scripts/dev.sh` for watch mode during local development.

## Artifact Handling

* Do **not** commit `dist/` or `extension-archive.zip`; they are temporary build
  outputs and listed in `.gitignore`.
* After verifying a build you may remove these artifacts to keep the working
  tree clean.

## Coding Style

* Use two spaces for indentation in all `.ts`, `.tsx`, `.js` and `.json` files.

## Documentation

* If build instructions or project layout change, update `README.md` so new
  contributors can build the project without surprises.
* Further contribution policies are documented in `CONTRIBUTING.md` and the
  code of conduct.

