# Handoff Report — Explorer 1 (`explorer_r1_1`)

**Core Summary:** Both target repositories (`/home/antigravity/qsang2025/Qsang_vbook` and `/home/antigravity/qsang2025/Qsang_vbook_pro`) exist locally on branch `main` with clean git remotes and unified zero-dependency CLI pipelines (`node scripts/cli.js validate | build | build-catalog | health-check`), though they have subtle differences in `build.js`, `validate.js`, and fixture files (`health.json` vs `test.json`) that implementers must follow. Across `/home/antigravity/qsang2025/*`, several video extensions exist (`hhhtq`, `ophim`, `kkphim`/`phimapi.com`, `nguonc`, `yanhh3d`, `hhtqvietsub`, `shortmax`, `allshorts`, `gamomephim`, `phimfun`) with live HTTP 200 endpoints and unencrypted reference implementations in `vbook-ext_kychitoge` and `vbook-ext_Moleys`.

---

## 1. Observation

### 1.1 Target Repositories & Git Status
- **`/home/antigravity/qsang2025/Qsang_vbook`**:
  - Git remote: `origin https://github.com/qsang2025/Qsang_vbook.git` (branch `main`, clean working tree).
  - Current extensions in `plugin.json`: `extensions/novel/apptruyenchu` (v4) and `extensions/video/hhkungfu` (v3).
  - CLI entrypoint: `/home/antigravity/qsang2025/Qsang_vbook/scripts/cli.js` delegates to:
    - `tools/cli/validate.js` (`node scripts/cli.js validate`)
    - `tools/cli/build.js` (`node scripts/cli.js build [ext-dir]`)
    - `tools/cli/build-catalog.js` (`node scripts/cli.js build-catalog [--check]`)
    - `scripts/health-check.js` (`node scripts/cli.js health-check`)
    - `.agents/skills/vbook-extensions/scripts/vbook.js` (`connect` / `test` / `testall` / `install`)
- **`/home/antigravity/qsang2025/Qsang_vbook_pro`**:
  - Git remote: `origin https://github.com/qsang2025/Qsang_vbook_pro.git` (branch `main`, clean working tree).
  - Current extensions in `plugin.json`: `extensions/novel/apptruyenchu` (v3) and `extensions/video/hhkungfu` (v3).
  - CLI entrypoint: `/home/antigravity/qsang2025/Qsang_vbook_pro/scripts/cli.js` delegates directly to `/home/antigravity/qsang2025/Qsang_vbook_pro/scripts/{validate.js,build.js,build-catalog.js,health-check.js,vbook.js}`.

### 1.2 Critical Differences Between `Qsang_vbook` and `Qsang_vbook_pro` Build/Validate/Health-Check
| Feature | `Qsang_vbook` (`tools/cli/*` + `scripts/health-check.js`) | `Qsang_vbook_pro` (`scripts/*`) |
|---|---|---|
| **Extension Path** | `extensions/video/<ext-slug>/` | `extensions/video/<ext-slug>/` |
| **Shared `lib/` Inlining** | `tools/cli/build.js` (lines 300–362) copies `lib/*.js` (`config-helpers.js`, `fetch-helpers.js`, `cleanHtml.js`, `gbk.js`) into a **temp** dir when creating `plugin.zip`, OR accepts them in `src/` on disk. `validate.js` (lines 258–306) checks byte-for-byte equality between `plugin.zip` entries and disk (`src/` + `lib/`). | `scripts/build.js` (lines 178–191) copies any `load('<lib>.js')` from `lib/` **directly into `extensions/video/<slug>/src/` on disk** and into `plugin.zip`. `scripts/validate.js` (lines 250–254) **requires** every `load('...')` file to exist on disk in `extensions/video/<slug>/src/`! |
| **Watch out: `lib/` Difference** | `Qsang_vbook/lib/` and `Qsang_vbook_pro/lib/` have slightly different `config-helpers.js` / `fetch-helpers.js` byte contents! | When copying an extension from `Qsang_vbook` to `Qsang_vbook_pro`, **remove `config-helpers.js` / `fetch-helpers.js` from `src/` first, then run `node scripts/cli.js build` in each repo** so each repo bundles its own `lib/` version and passes byte-exact zip validation! |
| **Orphan `.js` Check in `src/`** | `tools/cli/validate.js` (lines 545–556): every `.js` file in `src/` must either be in `plugin.json.script`, be named `config.js` or `helper.js`, be in `lib/`, or be referenced by `load('...')` in another script. | `scripts/validate.js` (lines 230–235): every `.js` file in `src/` EXCEPT `config.js`, `cleanHtml.js`, `config-helpers.js`, `fetch-helpers.js`, `gbk.js`, `helper.js` MUST define `function execute(...)`. (Do NOT create custom helper filenames like `utils.js` — always name custom helpers `helper.js`!). |
| **Rhino ES6 Linter** | `tools/cli/validate.js` (lines 350–380) & `scripts/validate.js` (lines 58–104): Forbids arrow functions (`=>`), `async`/`await`, template literals (`` `...` ``), `?.`, `??`, spread (`...`), `.flat()`/`.flatMap()`. Also `AGENTS.md` in `Qsang_vbook_pro` mandates `var` instead of `let`/`const`. | Same linter rules. Use `var` and `function (...) {}` and `+` string concatenation exclusively. |
| **Non-recursive `load()`** | `load('file.js')` is top-level only. A file that is `load()`ed (`config.js`, `helper.js`, `config-helpers.js`, `fetch-helpers.js`) **MUST NOT** call `load(...)` itself (`validate.js` lines 589–598 & `pro/scripts/validate.js` lines 255–261). | Same rule (`[Rule 1 Violation]`). Only runnable scripts (`home.js`, `genre.js`, `search.js`, `detail.js`, `toc.js`, `chap.js`, `track.js`) call `load('config.js'); load('config-helpers.js'); load('fetch-helpers.js'); load('helper.js');`. |
| **Fixtures (`health.json` & `test.json`)** | `health-check.js` (lines 202–232) reads `health.json`: `{"cases": [{"name": "...", "url": "https://...", "pattern": "..."}]}`. `validate.js` (lines 309–341) validates `test.json`: `{"cases": [{"script": "search.js", "input": "...", "expect": {"contains": [...], "minItems": 1}}]}`. | `pro/scripts/health-check.js` (lines 123–146) probes `metadata.source` AND if `test.json` cases have `url` & `expectedPattern`, probes those too. `pro/scripts/validate.js` (lines 281–290) requires `test.json` to have a `"cases"` array. |
| **Catalog (`plugin.json` at root)** | Generated automatically via `node scripts/cli.js build-catalog`. `validate.js` checks that root `plugin.json` matches disk (`extensions/<type>/<name>/plugin.json`) and uses `main` branch URLs. | Generated automatically via `node scripts/cli.js build-catalog` (sorted alphabetically by `name`). |

### 1.3 Existing Video Extension Structure (`extensions/video/hhkungfu` & `templates/video`)
- Inspected `/home/antigravity/qsang2025/Qsang_vbook/extensions/video/hhkungfu/plugin.json` and `src/{config.js,helper.js,home.js,genre.js,search.js,detail.js,toc.js,chap.js,track.js}` plus `icon.png`, `health.json`, `test.json`, `README.md`, `plugin.zip`.
- **vBook Video Contract (verified from `extension-api.md` and `templates/video/`)**:
  - **Manifest (`plugin.json`)**:
    ```json
    {
      "config": {
        "DOMAIN": { "default": "https://...", "format": "text", "mode": "input", "title": "Domain" },
        "MIRRORS": { "default": "", "format": "text", "mode": "input", "title": "Mirror (cách nhau bằng dấu phẩy)" }
      },
      "metadata": {
        "author": "Qsang",
        "description": "...",
        "encrypt": false,
        "locale": "vi_VN",
        "name": "...",
        "nsfw": false,
        "regexp": "...",
        "source": "https://...",
        "type": "video",
        "version": 1
      },
      "script": {
        "chap": "chap.js",
        "detail": "detail.js",
        "genre": "genre.js",
        "home": "home.js",
        "search": "search.js",
        "toc": "toc.js",
        "track": "track.js"
      }
    }
    ```
    *(Note: `explore.js` is optional; if `home.js` / `genre.js` tabs point to `"script": "search.js"` with path/URL inputs like `"/moi-cap-nhat"`, then no separate `gen.js` is needed, or if `gen.js` is used it must be declared or loaded).*
  - **Video Playback Chain (`toc.js` → `chap.js` → `track.js`)**:
    1. `toc.js(url)` returns `Response.success([{ name: "Tập 1", url: "https://...", description: "", lock: false, pay: false }, ...])`.
    2. `chap.js(episodeUrl)` returns `Response.success([{ title: "Server 1", data: "<streamUrl or payload>" }, ...])`.
    3. `track.js(data)` resolves `data` from `chap.js` and returns:
       - For direct `.m3u8` / `.mp4`:
         ```js
         return Response.success({
             type: "native",
             data: streamUrl,
             host: siteOrigin(),
             mimeType: streamUrl.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
             headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" },
             timeSkip: []
         });
         ```
       - Or for working embed URLs: `type: "auto"` (or `"webview"` fallback).

### 1.4 Existing Video Extensions Across `/home/antigravity/qsang2025/*` & Live Probe Results
We searched all 35 repositories in `/home/antigravity/qsang2025/` for `"type": "video"` and probed their domains:
1. **`vbook-ext_kychitoge/extensions/video/` (UNENCRYPTED, readable JS source)**:
   - `kychi_hhhtq` (`https://hhhtq.team` — Hoạt hình 3D Trung Quốc Vietsub): **HTTP 200 (86KB)**. Extracts `var player_aaaa = {... "url": "..."}` from `/xem/<slug>-sv<N>-ep<M>/`. Supports direct `.m3u8`/`.mp4` and DU server (`bysezejataos.com`).
   - `kychi_ophim` (`https://ophim17.cc` / API `https://ophim1.com/v1/api/...`): JSON API with `link_m3u8` and `link_embed` per episode.
   - `kychi_phimfun` (`https://phimfun.net`): **HTTP 200 (407KB)**.
   - `kychi_yeuanime` (`https://yeuanime.net` -> `https://yeuanime.buzz`): HTTP 522 (Cloudflare origin timeout during probe).
2. **`vbook-ext_Moleys/kkphim` (UNENCRYPTED, readable JS source)**:
   - Uses public JSON API `https://phimapi.com` (`https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1&country=trung-quoc` -> **HTTP 200, 32KB JSON**!).
   - Detail/TOC API: `https://phimapi.com/phim/<slug>` returns `episodes[].server_data[].link_m3u8` (raw `.m3u8` streams playable with `type: "native"`!) and `link_embed`.
3. **`vbook-extensions_Darkrai9x/` (ENCRYPTED `src/*.js`, readable `plugin.json` metadata)**:
   - Chinese 3D Animation sources:
     - `yanhh3d`: `https://yanhh3d.ee` — **HTTP 200 (230KB)** ("Xem hoạt hình Trung Quốc (donghua) trên YanHH3D").
     - `hhtqvietsub`: `https://hhtq.press` — **HTTP 200 (94KB)** ("Xem phim hoạt hình Trung Quốc trên HHTQ Vietsub").
   - Short Drama / Chinese AI & Short Video sources:
     - `shortmax`: `https://www.shorttv.live/vi` — **HTTP 200 (406KB)**.
     - `allshorts`: `https://allshorts.net` — **HTTP 200 (61KB)**.
     - `gamomephim`: `https://gamomephim.com` (redirects to `https://gamomephim1.com/`) — **HTTP 200 (168KB)**.
     - `vieflix`: `https://vieflix.top` (uses `phimapi.com`).
4. **`ext-vbook_yae-miko-313/extensions/video/nguonc` (UNENCRYPTED)**:
   - `https://phim.nguonc.com` (returned HTTP 403 on direct probe without browser headers/cookies).

---

## 2. Logic Chain

1. **Repository & Pipeline Readiness (from Obs 1.1 & 1.2)**: Both `Qsang_vbook` and `Qsang_vbook_pro` are already cloned locally, point to their respective GitHub remotes on branch `main`, and currently pass `node scripts/cli.js validate` (2 extensions each: `apptruyenchu` and `hhkungfu`).
2. **Packaging & Validation Requirements (from Obs 1.2)**:
   - Every new video extension must be placed in `extensions/video/<slug>/` in both `Qsang_vbook` and `Qsang_vbook_pro`.
   - Each extension directory must contain: `plugin.json`, `icon.png`, `health.json`, `test.json`, `src/config.js`, `src/helper.js` (if needed), and the scripts mapped in `plugin.json.script` (`home.js`, `genre.js`, `search.js`, `detail.js`, `toc.js`, `chap.js`, `track.js`).
   - Because `Qsang_vbook` and `Qsang_vbook_pro` have slightly different `lib/*.js` files and `validate.js` checks byte-for-byte zip integrity (in `Qsang_vbook`) and on-disk `src/<lib>.js` presence (in `Qsang_vbook_pro`), the build sequence in each repo must be:
     1. Place only the extension's own scripts (`config.js`, `helper.js`, `home.js`, `genre.js`, `search.js`, `detail.js`, `toc.js`, `chap.js`, `track.js`) in `extensions/video/<slug>/src/`.
     2. In `Qsang_vbook_pro`: run `node scripts/cli.js build extensions/video/<slug>` (which copies `Qsang_vbook_pro/lib/*.js` into `src/` and creates `plugin.zip`).
     3. In `Qsang_vbook`: either copy `Qsang_vbook/lib/{config-helpers.js,fetch-helpers.js}` into `src/` or let `tools/cli/build.js` inline them into `plugin.zip` via `node scripts/cli.js build extensions/video/<slug>`.
     4. Run `node scripts/cli.js build-catalog`, `node scripts/cli.js validate`, and `node scripts/cli.js health-check` in both repos.
3. **Playback Contract (from Obs 1.3)**:
   - Note that in `Qsang_vbook` / `Qsang_vbook_pro` (current vBook engine API), video extensions use the 2-step `chap.js` → `track.js` chain (`chap.js` returns `Response.success([{ title, data }])`, and `track.js` returns `Response.success({ type: "native"|"auto", data: url, host, mimeType, headers })`). Both `chap.js` and `track.js` must be present in `plugin.json.script`.

---

## 3. Caveats

- Darkrai9x's `src/*.js` files (`yanhh3d`, `hhtqvietsub`, `shortmax`, `allshorts`, `gamomephim`) are AES-encrypted (`"encrypt": true`), so only their `plugin.json` metadata (domains, regexes) can be referenced; their HTML/API structure must be inspected directly from the live sites (which Explorer 2 is investigating, or we can inspect directly).
- In `Qsang_vbook/scripts/health-check.js`, any `MOVED` (3xx redirect to a different origin, e.g., `gamomephim.com` -> `gamomephim1.com`) or `DEGRADED` status causes `health-check.js` to exit with code `1`. Therefore, `metadata.source` in `plugin.json` and all URLs in `health.json` / `test.json` MUST use the final canonical domain (no cross-origin redirects) and return HTTP 200 with matching patterns.

---

## 4. Conclusion

1. **Target Repos**: `/home/antigravity/qsang2025/Qsang_vbook` and `/home/antigravity/qsang2025/Qsang_vbook_pro` are ready on `main`.
2. **Required Files per Video Extension (`extensions/video/<slug>/`)**:
   - `plugin.json` (`type: "video"`, `locale: "vi_VN"`, `encrypt: false`, `author: "Qsang"`, `script: { home, genre, search, detail, toc, chap, track }`)
   - `icon.png` (valid PNG icon)
   - `health.json` (`{"cases": [{"name": "...", "url": "...", "pattern": "..."}]}`)
   - `test.json` (`{"cases": [{"script": "search.js", "input": "...", "expect": {"contains": [...], "minItems": 1}}, ...]}`)
   - `src/config.js`, `src/helper.js`, `src/home.js`, `src/genre.js`, `src/search.js`, `src/detail.js`, `src/toc.js`, `src/chap.js`, `src/track.js` (strictly Rhino ES6: `var`, `function`, `+` concat, no recursive `load()`).
3. **Required CLI Commands per Repo**:
   - `node scripts/cli.js build extensions/video/<slug>`
   - `node scripts/cli.js build-catalog`
   - `node scripts/cli.js validate`
   - `node scripts/cli.js health-check`

---

## 5. Verification Method

Run the following commands in both `/home/antigravity/qsang2025/Qsang_vbook` and `/home/antigravity/qsang2025/Qsang_vbook_pro`:
```bash
node scripts/cli.js build
node scripts/cli.js build-catalog
node scripts/cli.js validate
node scripts/cli.js health-check
```
Both `validate` and `health-check` must exit with code `0` (`PASS` and all extensions `HEALTHY`).
