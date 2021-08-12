(cd ../core && npm i -ci && npm run build)

(cd extension-background && npm i ../../core) &
(cd extension-popup && npm i ../../core)

wait