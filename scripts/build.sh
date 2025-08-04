#!/bin/sh
set -e
pnpm install
rm -rf dist extension-chrome.zip extension-firefox.xpi
mkdir -p dist
# Build shared packages first
(pnpm --filter ./src/core run build) &
(pnpm --filter ./src/design-system run build) &
wait
# Then build extension pieces
(pnpm --filter ./src/background run build) &
(pnpm --filter ./src/popup run build) &
wait
cp -r src/assets/* dist/
zip -r -FS extension-chrome.zip dist/
(cd dist && zip -r -FS ../extension-firefox.xpi *)
