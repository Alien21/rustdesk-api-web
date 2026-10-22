# RustDesk API Web
# 基于 Vue3 + Element Plus 的后台, 适用于 [RustDesk API](https://github.com/lejianwen/rustdesk-api)

<a href="https://github.com/vuejs/vue-next">
    <img src="https://img.shields.io/badge/vue-^3.2.16-brightgreen.svg" alt="vue3">
  </a>
  <a href="https://github.com/element-plus/element-plus">
    <img src="https://img.shields.io/badge/element--plus-^2.8.2-brightgreen.svg" alt="element-plus">
  </a>
  <a href="https://github.com/lejianwen/Gwen-admin/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/mashape/apistatus.svg" alt="license">
  </a>

# 安装步骤

```shell
git clone https://github.com/lejianwen/rustdesk-api-web
cd rustdesk-api-web   
npm install

// 本地开发
npm run dev

// 打包
npm run build

```

## Fork provenance

This fork keeps the existing `api-token` API and the RustDesk 1.5.0/1.5.1 client contract. The following focused fixes were adapted on top of [lejianwen/rustdesk-api-web, 3998c2a](https://github.com/lejianwen/rustdesk-api-web/commit/3998c2a):

- [WILSONowo, b9d92d8f40ae3fed07a07605ad30d3b26392c0dd](https://github.com/WILSONowo/rustdesk-api-web/commit/b9d92d8f40ae3fed07a07605ad30d3b26392c0dd): CSV formula neutralization for headers and values, proper quoting, and empty/null handling.
- [HanGYvv, d9b710580257b6a5ac4220c414259af82fbb3f0e](https://github.com/HanGYvv/rustdesk-api-web/commit/d9b710580257b6a5ac4220c414259af82fbb3f0e): logout clears both stored token copies, OIDC data and user identity, resets live user state, and avoids logging login responses. The existing webclient token synchronization is retained; the API 403 handler uses the same logout cleanup.
- [laiyouxing, c409c5c5eef3f73e3fd41b571fa3a5a3f76a504a](https://github.com/laiyouxing/rustdesk-api-web/commit/c409c5c5eef3f73e3fd41b571fa3a5a3f76a504a): DOMPurify sanitizes the remote welcome Markdown after parsing. The HTML-only profile preserves normal Markdown formatting and links. The other `v-html` usage contains a fixed, local WIKI link and has no remote HTML input.

Cookie authentication, JWT requirements, role-v3/record ACL changes and the forks' unrelated UI/dependency changes are not included. These browser-side protections do not replace backend authorization.

For future updates, fetch the candidate branch without merging, find its common base with `git merge-base HEAD <candidate-ref>`, then inspect `git log --no-merges <base>..<candidate-ref>` and `git diff <base>..<candidate-ref> -- src/utils/file.js src/utils/auth.js src/store/user.js src/utils/request.js src/utils/markdown.js src/views/my/info.vue package.json package-lock.json`. Review actual authored changes separately from upstream synchronization before porting a small patch.

`npm test` runs CSV and real-Pinia logout regressions. With the Vite development server running, open `/tests/markdown.browser.html` for the DOMPurify regression; it must report `PASS` while preserving headings, emphasis, tables, safe links and images.

A local compatibility follow-up decodes quoted headers and escaped quotes in the existing peer CSV importer, preserving exported peer IDs on re-import.

## Build output locations

Standalone `npm run build` writes `artifacts/publish/web/` and uses `artifacts/cache/vite/`. The workspace launcher sets the absolute `RUSTDESK_ARTIFACTS_DIR` base, normally `C:/Git/RustDesk/artifacts` (WSL: `/mnt/c/Git/RustDesk/artifacts`). Vite then uses:

- `<base>/rustdesk-api-web/publish/web/` for the web bundle.
- `<base>/rustdesk-api-web/cache/vite/<platform>-<arch>/` for its cache.

The namespace is fixed to `rustdesk-api-web`; redirected directories and output/cache paths overlapping the source checkout are rejected. Linux builds use an isolated source stage below the same namespace's `build/` directory. Unsetting the environment variable preserves standalone and CI paths.

`node_modules/` is the package manager's dependency tree. Dependency packages may contain their own directories named `artifacts`; those are package contents and must stay with the package. Selecting the shared output root does not move installed dependencies or existing artifacts.
