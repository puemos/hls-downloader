(sh ./scripts/copy-assets.sh) &
(npm run --workspace src/core dev) &
(npm run --workspace src/design-system dev) &
(npm run --workspace src/background dev) &
(npm run --workspace src/popup dev) &

wait
