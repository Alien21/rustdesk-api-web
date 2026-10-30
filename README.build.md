# Local build outputs

Use the sibling RustDesk workspace launcher from the `rustdesk/` checkout:

```sh
bash build_linux.sh --only apiweb --check
bash build_linux.sh --only apiweb
# Windows:
bash build_windows.sh --only apiweb --check
bash build_windows.sh --only apiweb
```

`--only api` builds this frontend and the API bundle together. The launchers
copy the current source tree to
`artifacts/rustdesk-api-web/build/<linux-amd64|windows-amd64>/source/` and run
`npm ci` and Vite only there. The source checkout is an input: do not run npm
commands that generate dependencies or build files in it.

The default shared base is the sibling `../artifacts/`; an absolute
`RUSTDESK_ARTIFACTS_DIR` selects another base. Project artifact roots contain
only `build/` and `publish/`:

- `<base>/rustdesk-api-web/publish/web/`: deployable static administration.
- `<base>/tools/rustdesk-api-web/npm/` and `npm-linux/`: npm caches.
- `<base>/tools/rustdesk-api-web/vite/<platform-arch>/`: Vite cache.
- `<base>/tools/rustdesk-api-web/linux-tools/`: portable Linux Node SDK/downloads.
- `<base>/tmp/<windows-x64|linux-x64>/rustdesk-api-web/`: temporary files.

Vite uses the same sibling base for its cache and output when the environment
variable is unset. Low-level npm commands belong only in disposable working
copies under artifacts. Our helper scripts, harnesses, logs and reports belong
under `artifacts/AI/`.

The API helper discovers `<base>/rustdesk-api-web/publish/web/` automatically.
An explicit `WEB_DIST` overrides that frontend input. Deploy the complete
`index.html` and asset tree together so their hashes stay consistent.
