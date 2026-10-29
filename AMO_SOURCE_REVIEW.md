# AMO Source Review Build

These steps reproduce the Firefox Add-ons submission package from the uploaded
source archive.

## Environment

- Ubuntu 24.04 LTS ARM64
- Node.js 22.23.4
- npm 10.9.9
- pnpm 12.16.1, installed through npm
- `zip` command available on `PATH`

## Build

```bash
sudo apt-get update
sudo apt-get install -y zip
npm install --global pnpm@12.16.1

node --version
npm --version
pnpm --version

pnpm install --frozen-lockfile
pnpm run build:mv2
pnpm exec web-ext lint --source-dir dist/mv2
```

The version commands must report Node.js `v22.23.4`, npm `10.9.9`, and pnpm
`12.16.1`. Install pnpm through npm so reviewer builds use the pinned version.

The Firefox extension files are written to `dist/mv2`. The signed submission
uses that directory as its source package.

## Expected Artifacts

- `dist/mv2/manifest.json`
- `dist/mv2/background.js`
- `dist/mv2/assets/worker-*.js`
- `dist/mv2/assets/disk-mux-worker-*.js`
- `dist/mv2/popup.html`
- `dist/mv2/popup.css`
- `dist/mv2/popup.js`
- `dist/extension-mv2-firefox.xpi`

`browser_specific_settings.gecko.id` and
`browser_specific_settings.gecko.strict_min_version: "128.0"` and
`data_collection_permissions.required: ["none"]` are committed in
`src/assets/manifest.json`; no post-build manifest edits are required.

The two generated workers are local build artifacts. `worker-*.js` is the
`@ffmpeg/ffmpeg` compatibility worker for pre-existing IndexedDB jobs.
`disk-mux-worker-*.js` handles new OPFS-backed jobs. Its dynamic import URL is
always built with the extension runtime API and points only to the committed
`assets/ffmpeg/ffmpeg-core.js`; it does not load remote code.

Functional test instructions are in `FOR-DEAR-TESTERS.md`.
