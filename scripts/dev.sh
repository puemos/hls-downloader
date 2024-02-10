(sh ./scripts/copy-assets.sh) &
(npm run --prefix src/core dev) &
(npm run --prefix src/design-system dev) &
(npm run --prefix src/background dev) &
(npm run --prefix src/popup dev) &

wait
