#!/bin/sh
set -e
mkdir -p dist
cp -r src/assets/* dist/
(pnpm --filter ./src/core run dev) &
(pnpm --filter ./src/design-system run dev) &
(pnpm --filter ./src/background run dev) &
(pnpm --filter ./src/popup run dev) &
wait
