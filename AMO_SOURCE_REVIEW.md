# AMO Source Review Build

These steps reproduce the Firefox Add-ons submission package from the uploaded
source archive.

## Environment

- Ubuntu 24.04 LTS ARM64
- Node.js 22.11.0
- npm 10.9.0
- `zip` command available on `PATH`

## Build

```bash
corepack enable
corepack prepare pnpm@10.11.0 --activate
pnpm install --frozen-lockfile
pnpm run build:mv2
```

The Firefox extension files are written to `dist/mv2`. The signed submission
uses that directory as its source package.

## Expected Artifacts

- `dist/mv2/manifest.json`
- `dist/mv2/background.js`
- `dist/mv2/popup.html`
- `dist/mv2/popup.css`
- `dist/mv2/popup.js`
- `dist/extension-mv2-firefox.xpi`

`browser_specific_settings.gecko.id` and
`data_collection_permissions.required: ["none"]` are committed in
`src/assets/manifest.json`; no post-build manifest edits are required.
