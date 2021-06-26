rm -rf extension-archive.zip

(cd ./src/extension/ && sh ./update-core.sh)
(cd ./src/extension/ && sh ./build-extension.sh)
(cd ./src/extension/dist/ && zip -r extension-archive.zip .)
mv ./src/extension/extension-archive.zip extension-archive.zip
