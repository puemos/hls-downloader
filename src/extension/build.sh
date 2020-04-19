rm -rf dist
mkdir dist

(cp -r ./pack/* ./dist/) &
(sh ./build-popup.sh) &
(sh ./build-background.sh) &

wait