# Local build outputs

Run `npm ci` and `npm run build` from this repository. The deployable static web
administration is written to `artifacts/publish/web/`. `npm run serve` previews
that same directory. Vite's working cache lives in `artifacts/cache/vite/`.

The whole `artifacts/` directory is ignored by Git. For local commands, use
`npm --cache ./artifacts/cache/npm ci` to keep the npm download cache here too.
`node_modules/` remains the standard ignored dependency directory.

To include this build in the sibling API package, set `WEB_DIST` to this
repository's absolute `artifacts/publish/web` path before running the API build.
