rm -rf dist
mkdir dist

(cp -r ./extension-assets/* ./dist/) &
(sh ./build-extension-popup.sh) &
(sh ./build-extension-background.sh) &

wait