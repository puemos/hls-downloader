(cd ../core && yarn && yarn build)

(cd extension-background && yarn add ../../core) &
(cd extension-popup && yarn add ../../core)

wait