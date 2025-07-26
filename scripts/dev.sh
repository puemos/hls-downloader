(sh ./scripts/copy-assets.sh) &
(pnpm --filter ./src/core run dev) &
(pnpm --filter ./src/design-system run dev) &
(pnpm --filter ./src/background run dev) &
(pnpm --filter ./src/popup run dev) &

wait
