rm -rf extension-archive.zip

(cd ./src/extension/ && sh ./build-extension.sh)
(cd ./src/extension/ && zip -r extension-archive.zip ./dist/**)
mv ./src/extension/extension-archive.zip extension-archive.zip
