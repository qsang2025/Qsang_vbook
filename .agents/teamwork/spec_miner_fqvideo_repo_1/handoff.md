# Handoff Report — `spec_miner_fqvideo_repo_1` (Repo Rules, Skill, Video Template & Prior Benchmarks)

- **Agent**: `spec_miner_fqvideo_repo_1` (Specification Miner — Read-Only)
- **Dispatched By**: Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`)
- **Scope**: `ORIGINAL_REQUEST.md` § `Follow-up — 2026-11-20T02:11:43Z` (FQ Video extension for `https://fanqienovel.com` in `Qsang_vbook`, new git branch, do not merge prematurely)
- **Handoff Type**: **Hard** (Task complete)
- **UTC Start Time**: `2026-11-20T02:16:04Z`
- **UTC End Time**: `2026-11-20T02:25:58Z` (elapsed: **9m 54s**)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Repo Governance | Dual-copy canonical API contract | `extension-api.md` and `.agents/skills/vbook-extensions/reference/extension-api.md` must remain byte-identical (verified md5 `982141b2e170b77bbef8f1d4b20cab25`) | Any API contract lookup | Single authoritative spec for engine API | Never infer API from memory or old extensions | `AGENTS.md:19-26`, `md5sum` |
| 2 | Repo Governance | Single source of truth (`src/`) + committed `plugin.zip` | `extensions/<type>/<slug>/src/` is canonical; `plugin.zip` is generated offline by CLI and committed alongside source so vBook app can install via GitHub raw URL | `extensions/<type>/<slug>/src/*` + `plugin.json` + `icon.png` | `extensions/<type>/<slug>/plugin.zip` | Never hand-zip or hand-edit `plugin.zip`; `.gitignore:20-21` blocks all `*.zip` except `!extensions/**/plugin.zip` | `AGENTS.md:42-47,119-130`, `.gitignore:20-21` |
| 3 | Repo Governance | Auto-generated root catalog (`plugin.json`) | Root `plugin.json` (121 entries currently) is generated exclusively by `build-catalog.js`; registry URLs hardcode `BRANCH = "main"` | All `extensions/<type>/<slug>/plugin.json` | Root `plugin.json` (`{ metadata: { author: "MuseAi", description }, data: [...] }`) | Never hand-edit root `plugin.json`; `validate.js` & CI (`validate.yml:34-35`) fail on any drift or non-`main` branch URL | `AGENTS.md:49-72`, `tools/cli/build-catalog.js:17-20,106-159`, `.github/workflows/validate.yml:32-35` |
| 4 | Repo Governance | Uniform author & GPL/license attribution | `metadata.author` MUST be exact string `"MuseAi"` (no `(ref: ...)` suffixes); any attribution/ref notes go in `metadata.description` and `README.md`. Repo license is MIT; `duongden/vbook` is GPL-3.0 (do not copy GPL code verbatim without complying; clean-room / pattern-only if porting) | `plugin.json` `metadata.author`, `metadata.description` | Uniform author filter in vBook app | Non-`"MuseAi"` root author triggers `validate.js:554-556` warning; copying GPL code violates MIT repo policy | `AGENTS.md:166-177`, `ORIGINAL_REQUEST.md:32` |
| 5 | Manifest Schema | `plugin.json` metadata contract | Required fields: `name`, `author` (`"MuseAi"`), `version` (integer ≥ 1, never string `"1.2"`), `source` (base URL matching `config.DOMAIN.default`), `description`, `locale`, `regexp`, `type`, `language: "javascript"`, `encrypt: false`, `nsfw: false` | Manifest JSON object | Parsed by vBook engine, `validate.js`, `build-catalog.js`, `health-check.js` | Missing `name`/`version`/`source`/`type`/`locale` or invalid `type`/`locale` causes `validate.js:606-618` hard FAIL | `extension-api.md:59-140`, `AGENTS.md:87-96`, `tools/cli/validate.js:50-51,605-622` |
| 6 | Manifest Schema | Strict `locale` & `type` enums | `validate.js` enforces `LOCALES = ["vi_VN", "zh_CN", "ja_JP", "en_US", "zh_TW"]` and `TYPES = ["novel", "comic", "chinese_novel", "video", "audio", "translate", "tts", "ai"]`. Folder category `<type>` must match `metadata.type` | `metadata.locale`, `metadata.type`, directory path | Registry classification & app filtering | Non-standard locale (`zh-CN`, `vi`, `en`) or type causes `validate.js` hard FAIL; folder/type mismatch emits warning | `tools/cli/validate.js:50-51,611-622`, `AGENTS.md:87-91` |
| 7 | Manifest Schema | `regexp` whole-string URL routing | Kotlin `String.matches` against entire URL (and URL minus `http(s)://` and trailing `/`). Must match real full detail URLs (not bare host) | Pasted/shared URL string | Routes URL to extension's `detail.js` | Bare host like `fanqienovel\\.com` never matches; invalid regex silently skipped | `extension-api.md:117-121`, `reference/runtime.md:24-25` |
| 8 | Manifest Schema | Static `config` & connection limits | `config` keys (`DOMAIN`, `MIRRORS`, etc.) are injected into every script as **string** constants (`const DOMAIN = "..."`). `config.DOMAIN.default` MUST equal `metadata.source`. Connection keys (`thread_num`, `delay`, `ignore`) must be bare JSON numbers/booleans | `plugin.json` `config` block | Injected JS constants + app download pacing | Declaring `var`/`let`/`const` with same name as a config key crashes every script with `SyntaxError`; quoted `"2"` is ignored for `thread_num` | `extension-api.md:249-348`, `modes/create.md:23-25`, `reference/runtime.md:10-14` |
| 9 | Manifest Schema | `script` map & required video scripts | Required for `video`: `search`, `detail`, `toc`, `chap`, `track`. Recommended/mandatory by house rule §6.3: `home`, `genre`, plus `src/config.js`. Optional: `page` (only if TOC paginated), `explore` (warning: if `explore` is declared, it overrides and hides `home`!) | `plugin.json` `script` object (`key -> "file.js"`) | Maps app lifecycle hooks to `src/*.js` | Every declared file must exist in `src/`; undeclared `.js` files not in `{config.js, helper.js}`, `lib/`, or `load()`ed trigger orphan error in `validate.js:638-663` | `extension-api.md:142-218`, `AGENTS.md:80-85`, `tools/cli/validate.js:638-663` |
| 10 | Video Contract | `home.js` static tabs (Rule 9) | MUST return static array `[{ title, input, script }]` with **zero network fetches** (`home.js` runs on extension open; a failing fetch blocks the entire home screen). Tabs route to `search.js` (or list script) with list path/category `input` | `execute()` (no args) | `Response.success([{ title, input, script }, ...])` | Never fetch inside `home.js`; return `Response.error(viMsg)` only if genuinely impossible | `AGENTS.md:100`, `extension-api.md:448-461`, `extensions/video/hhtqvietsub/src/home.js:1-13` |
| 11 | Video Contract | `genre.js` categories | Returns array `[{ title, input, script }]` for genres/categories/channels; static tabs preferred when site categories are fixed or API category list | `execute()` (no args) | `Response.success([{ title, input, script }, ...])` | Return Vietnamese `Response.error(...)` on failure | `extension-api.md:624-640`, `extensions/video/hhtqvietsub/src/genre.js:1-24` |
| 12 | Video Contract | `search.js` / list pagination & item `type` | Dual-mode list + keyword search. Items: `{ name, cover, link, description, tag, host, type?, referrerpolicy? }`. `next` token (`data2`) MUST be string (`""` when no more pages, never `null`/`0`). Optional item `type: "short"` opens TikTok-style vertical feed; `type: "stream"` skips detail | `execute(query, page)` (both strings; `page` empty on first page) | `Response.success(items, nextPageString)` | Items with empty `name` are dropped; de-duplicated by resolved `link`; empty query returns Vietnamese `Response.error(...)` | `extension-api.md:642-706,1843-1867`, `reference/runtime.md:18-19` |
| 13 | Video Contract | `detail.js` video metadata & formats | Returns `{ name, author, cover, description, detail, url, type: "video", format: "series"\|"stream"\|"short", ongoing, nsfw?, locale?, genres: [{ title, input, script }], referrerpolicy? }`. Use `format: "short"` for multi-episode short dramas (vertical auto-advancing feed) or `format: "series"` for episodes in regular player. Put visible chips in `genres` (`tags` is NOT displayed) | `execute(url)` (trailing `/` stripped by app at runtime) | `Response.success(detailObj)` | Empty `url: ""` is kept as-is (omit or pass canonical URL); string elements in `genres` fail entire detail; return Vietnamese `Response.error(...)` on fetch/parse failure | `extension-api.md:707-815,1869-1873`, `reference/type-contracts.md:19-21,51-53` |
| 14 | Video Contract | `toc.js` (+ optional `page.js`) episode list | `toc.js` returns `[{ name, url, description, lock, pay, type?: "chapter"\|"section", host? }]`. If TOC is paginated, declare `page.js` returning ≥1 absolute TOC-page URLs; otherwise omit `page.js` | `execute(url)` (book URL or page URL) | `Response.success(chapters)` | Empty array from `page.js` or any `toc` page empties the episode list; never send `host: ""` (omit instead) | `extension-api.md:817-885` |
| 15 | Video Contract | `chap.js` (Video Step 1 of `chap`→`track`) | Returns playable server/quality track list for one episode: `[{ title, data }]`. `title` MUST be unique & non-empty (used by player to remember selected server/quality). `data` is opaque string passed verbatim to `track.js` (direct media URL, episode/video ID, or `JSON.stringify({...})`). `data2` is ignored for video | `execute(episodeUrl)` | `Response.success([{ title, data }, ...])` | Bare URL string as `data` breaks JSON re-parsing — ALWAYS wrap in array; no automatic fallback between tracks on failure | `extension-api.md:1036-1102`, `modes/create.md:47-51` |
| 16 | Video Contract | `track.js` (Video Step 2 of `chap`→`track`) | Resolves one track's `data` to `{ type, data, host, mimeType, headers, timeSkip, subtitles?, audios?, danmaku?, drm? }`. `type` exact lowercase: `"native"` (preferred: direct `.m3u8`/`.mp4` http(s) URL, HLS `data:` URI, or raw `#EXTM3U`), `"auto"` (headless WebView sniff), `"webview"` (last resort). `host` = origin of stream URL (`originOf(stream)`). `timeSkip` = integer ms `[{ fromTime, toTime }]` | `execute(data)` (verbatim `track.data` from `chap.js`) | `Response.success({ type: "native", data: streamUrl, host, mimeType, headers, timeSkip: [], subtitles?, danmaku? })` | Missing/uppercase `type` (`"Native"`), relative URL, or object `data` causes playback error; `Response.error(viMsg)` displays error in video player. **Task 116 lesson**: `"auto"` can pass `code:0` yet fail Play in app — FQ Video MUST resolve `"native"` | `extension-api.md:933-1033,1108-1172,1809-1835`, `muse-teamwork/tasks/116-*.json:34` |
| 17 | Runtime & Linter | Rhino ES6 syntax & `node --check` | Strictly ES5/Rhino ES6 (`var`, `function`, `+` concat). Banned: `` `template` ``, `=>`, `async`/`await`, `?.`, `??`, `...spread`, `.flat()`/`.flatMap()`, numeric separators, named regex groups, lookbehind, Java interop. `validate.js` runs both `lintRhinoES6()` and `node --check` on every `src/*.js` and `lib/*.js` | All `src/*.js` and `lib/*.js` | Syntax & Rhino compliance check | Any forbidden syntax or JS syntax error fails `validate.js` (exit 1) | `tools/cli/validate.js:437-487,674-686,743-752`, `reference/runtime.md:27-36` |
| 18 | Runtime & Linter | `load()` non-recursive text substitution & Rule 12 | `load('file.js')` does raw text replacement from top-level `src/` before execution. Argument must be string literal, no `/` or `\`, non-recursive (loaded file MUST NOT call `load()`). **Rule 12**: NEVER write `load('...')` inside `//` or `/* */` comments — both runtime and `build.js:70-81` scan comments! Write bare `file foo.js` in comments. `crypto.js` resolves to built-in CryptoJS shim | `load('foo.js');` in `src/*.js` | Inlined source at runtime and in `plugin.zip` | Comment `load('...')` triggers `validate.js:717-721` FAIL and runtime `UniqueTag cannot be cast to Function` (code 403); recursive `load()` triggers `validate.js:724-733` FAIL | `AGENTS.md:103,132-145`, `extension-api.md:1664-1677`, `tools/cli/validate.js:179-252,707-733` |
| 19 | Runtime & Networking | No UA rotation (Rule 10) + Request pacing (Rule 11) | Keep default runtime User-Agent (do not rotate UA; preserves `cf_clearance` and avoids WAF mismatches). Pace requests 1-at-a-time per host with `rateLimitDelay()` / `pacedFetch()` (`lib/rate-limit.js`): exponential backoff + jitter ≤3 retries on 429/405/503, cooldown on 405/429, no browser fallback on 405/429, Vietnamese error message via `rateLimitErrorMessage()` | `fetch()` / `pacedFetch()` calls | Rate-limit-safe HTTP responses | `fetch()` never throws on network error (returns `status: 504, ok: false`, `json()` throws); always check `res.ok` | `AGENTS.md:101-102`, `lib/rate-limit.js:38-356`, `extension-api.md:1220-1225` |
| 20 | Runtime Quirks | `Elements.first()` non-null quirk & trailing-slash stripping | On real vBook Android runtime, `el.select(...).first()` returns an empty truthy object instead of `null` (use `lib/safe-first.js` or check `.size() > 0`). App strips trailing `/` from URL args at runtime, whereas `/extension/test` does NOT — normalize in `config.js` / `helper.js` | DOM queries & URL inputs | Reliable parsing across Android/iOS/test server | Relying on `if (!el.select(...).first())` silently breaks fallback chains; on iOS failing native bridges return `undefined` instead of throwing | `lib/safe-first.js:1-20`, `extension-api.md:172-175,1178-1180,1309-1310`, `reference/runtime.md:22-23,34-36` |
| 21 | Lib-Inline & `vbook.js` | Dual requirement for `lib/` files in `src/` | `tools/cli/build.js:284-320` inlines missing `load()`ed root `lib/` files into a temp dir when creating `plugin.zip`, **BUT** `.agents/skills/vbook-extensions/scripts/vbook.js:270-273` (`test`/`install`) ONLY reads files present on disk in `src/`! Therefore any root `lib/*.js` used via `load()` MUST also be copied into `src/` (as `hhtqvietsub/src/` does), AND `validate.js:689-699` enforces exact MD5 match between `src/<lib>.js` and root `lib/<lib>.js` | `lib/*.js` copied into `extensions/video/<slug>/src/` | Works identically in `vbook.js test/install`, `build.js`, and `validate.js` | Missing from `src/` breaks `vbook.js test/install`; modified copy in `src/` fails `validate.js` MD5 drift check | `tools/cli/build.js:284-320`, `tools/cli/validate.js:689-699`, `.agents/skills/vbook-extensions/scripts/vbook.js:263-283`, `extensions/video/hhtqvietsub/src/` |
| 22 | CLI Toolchain | One-door CLI (`scripts/cli.js`) & npm scripts | Offline commands: `node scripts/cli.js validate`, `node scripts/cli.js build [ext-dir]`, `node scripts/cli.js build-catalog [--check]`, `node scripts/cli.js health-check`. Device commands (require phone dev server): `connect`, `test <ext> <script> [args...]`, `testall [ext...]`, `install <ext>` | Subcommand + args (plus `VBOOK_SERVER` / `--server` / `servers.json` for device cmds) | Exit 0 on pass, exit 1 on fail | `validate` takes ~1m45s across 121 exts (`node --check` per file); device commands fail loudly if server unreachable | `scripts/cli.js:1-173`, `package.json:16-25`, `reference/cli.md:1-66` |
| 23 | Fixtures & CI | `test.json` (golden) vs `health.json` (CI light probe) | Two strictly separate fixtures: `test.json` (`{"cases":[{"script","input","expect":{"contains","minItems"}}], "note"}`) for device testing; `health.json` (`{"cases":[{"name"?,"url","pattern"?}]}`) for daily CI HTTP probe (`scripts/health-check.js`, 10s hard timeout, 512KB sample, max 5 redirects, classifies `HEALTHY`/`MOVED`/`DEGRADED`/`BROKEN`/`BLOCKED`) | `test.json`, `health.json` in extension root | Validated by `validate.js:398-430,491-522`; `health.json` probed by `scripts/health-check.js` | Invalid JSON, missing `script`/`input`/`expect` in `test.json`, missing `url` or bad regex `pattern` in `health.json` fails `validate.js`; HTTP 403/405/TLS drop classified `BLOCKED` (not `failedCount`) | `AGENTS.md:152-164,179-223`, `tools/cli/validate.js:398-430,491-522`, `scripts/health-check.js:1-446` |
| 24 | Icon Requirement | Mandatory `icon.png` | Every extension MUST ship `<ext-dir>/icon.png` (200×200 PNG preferred, ≤5 MB, real site logo/favicon, never placeholder; final device install never uses `--no-icon`) | Real site icon resized to 200×200 PNG | Packaged into `plugin.zip` and linked in root `plugin.json` `icon` URL | Missing `icon.png` triggers `build-catalog.js:112-117` stderr warning and iconless extension in app | `modes/create.md:34-38,104-106`, `extension-api.md:52-53`, `tools/cli/build-catalog.js:111-117` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | `locale` discrepancy (`extension-api.md` vs `validate.js`) | `"locale": "zh-CN"` or `"vi"` (per `extension-api.md:111`) | **FAILS `validate.js:50,616-618`!** Repo validator strictly requires `vi_VN`, `zh_CN`, `ja_JP`, `en_US`, or `zh_TW`. Must use `"zh_CN"` (or `"vi_VN"` if Vietnamese-localized) with underscore, NEVER hyphen |
| 2 | `templates/video/` vs `AGENTS.md` drift | Copying `templates/video/plugin.json` or `templates/video/track.js` verbatim | `templates/video/plugin.json` has `"author": "Qsang"` (violates `AGENTS.md` §11 `"author": "MuseAi"`); `templates/video/track.js:16,27` hardcodes desktop `User-Agent` (violates Rule 10). Always use `extensions/video/hhtqvietsub/` + `hoathinh3d`/`hoathinh_ai` as the modern baseline instead |
| 3 | `explore.js` + `home.js` declared together | Both `"home"` and `"explore"` in `plugin.json.script` | Per `extension-api.md:215-216`, `explore` wins and `home` is completely ignored. Declare ONLY `home` (matching `hhtqvietsub`, `hoathinh3d`, `hoathinh_ai`), OR ONLY `explore` if building a multi-section home page |
| 4 | `load('...')` inside comments (Rule 12) | `// load('rate-limit.js')` or `/* load("crypto.js") */` in `src/*.js` or `lib/*.js` | Runtime vBook treats it as a real `load()`, breaking `execute` with `UniqueTag cannot be cast to Function` (code 403); `build.js:73` inlines the file; `validate.js:193-252,717-721` hard-FAILS. Note `load()` with empty parens does not match regex, but writing `file rate-limit.js` is the required convention |
| 5 | `vbook.js` test/install vs `build.js` lib inlining | Script calls `load('rate-limit.js')`, file exists only in root `lib/` and NOT in `src/` | `tools/cli/build.js` succeeds (inlines from `lib/` into temp dir for zip), **BUT** `vbook.js test` / `install` only reads `src/*.js` on disk (`vbook.js:270-273`), so `load('rate-limit.js')` silently expands to nothing and crashes on device! Copying exact byte-identical `lib/*.js` into `src/` satisfies `vbook.js`, `build.js`, AND `validate.js` MD5 check |
| 6 | Feature branch URLs in `build-catalog.js` & `validate.js` | Running `build-catalog` and `validate` on branch `feature/fqvideo` | Both `build-catalog.js:18` and `validate.js:48` hardcode `BRANCH = "main"`. Registry URLs MUST still point to `/main/extensions/video/fqvideo/plugin.zip` even while working on `feature/fqvideo` so `validate` passes and PR merges cleanly into `main` |
| 7 | Untracked root `.md` files & `.agents/teamwork/` | Presence of `PROJECT.md`, `TEST_INFRA.md`, `TEST_READY.md`, or `.agents/teamwork/*` | **`validate.js` ignores them completely** (only checks root `plugin.json`, `extensions/**`, `lib/*.js`). However, `.gitignore` does **NOT** ignore them — NEVER run `git add -A` (`PROTOCOL.md:152`); explicitly stage only `extensions/video/<slug>/` and root `plugin.json` |
| 8 | Video `chap.js` single-source bare string | `return Response.success(streamUrl)` from `chap.js` | Fails in vBook app (app re-parses bare string as JSON). MUST wrap as `Response.success([{ title: "1080p", data: streamUrl }])` (or server/quality list with unique non-empty `title`s) |
| 9 | Video `track.js` `"auto"` false-positive PASS (Task 116) | `track.js` returns `{ type: "auto", data: embedUrl }` | Device test `vbook.js test` returns `code: 0`, yet tapping Play in vBook app fails with `"Không thể tải máy chủ này. Hãy thử máy chủ khác."`. For FQ Video, `track.js` MUST resolve real direct stream URLs (`.mp4`/`.m3u8`) and return `type: "native"` |
| 10 | Short-drama vs series video format | `detail.js` `format: "short"` vs `"series"`, list item `type: "short"` | `detail.js` with `type: "video", format: "short"` opens episodes in vertical TikTok-style swipe feed (auto-advancing, resuming last episode). List items with `type: "short"` bypass detail and jump straight into vertical feed (links MUST be unique or short feed crashes!). Regular anime/TV series use `format: "series"` |
| 11 | `testall` directory discovery bug in `vbook.js` | Running `node scripts/cli.js testall` with NO ext args in `Qsang_vbook` | `vbook.js:115-124` scans top-level repo root dirs (`listExtDirs()`), NOT `extensions/<type>/<slug>/`! Always pass explicit path(s), e.g., `node scripts/cli.js testall extensions/video/fqvideo` |
| 12 | `health-check.js` exit code & `health-check-failures.json` | Running `node scripts/cli.js health-check` | Runs against ALL 121+ extensions (~minutes), writes gitignored `health-check-failures.json`, and exits 1 if ANY extension is non-HEALTHY (including `BLOCKED`). To test just FQ Video's `health.json` URLs during dev, probe those URLs directly with `curl` or a quick Node snippet, and avoid committing `health-check-failures.json` |
| 13 | `detail.js` `genres` vs `tags` | Returning category links in `tags: [...]` | `extension-api.md:777-778`: `tags` is translated but **NOT displayed** on the detail screen! Always put tappable category/genre chips in `genres: [{ title, input, script }]` |
| 14 | `build.js` deterministic zip & `validate.js` byte comparison | Editing any file in `src/` or `plugin.json` or `icon.png` without rebuilding `plugin.zip` | `validate.js:386-395` inflates every entry in `plugin.zip` and compares bytes with disk files (`content.equals(...)`). Always run `build` AFTER final edits to `src/`/`plugin.json`/`icon.png`, then `build-catalog`, then `validate` |

---

## 1. Observation

### 1.1 Exact Timestamps & Baseline Verification
- UTC Start: `2026-11-20T02:16:04Z` (`date -u +"%Y-%m-%dT%H:%M:%SZ"`).
- `extension-api.md` dual-copy MD5 check:
  - `982141b2e170b77bbef8f1d4b20cab25  extension-api.md`
  - `982141b2e170b77bbef8f1d4b20cab25  .agents/skills/vbook-extensions/reference/extension-api.md` (exact match).
- Baseline `node scripts/cli.js validate` executed cleanly on current `main` (`a761de0`):
  - Output: `Đã kiểm tra 121 nguồn, 121 mục trong registry: PASS (0 cảnh báo).` (exit code `0`, wall time ~1m45s).

### 1.2 Git State & Branch Conventions (`Qsang_vbook`)
- Current branch: `* main` at `a761de0` (`chore(ci): cập nhật STATUS.md [skip ci]`), synced with `origin/main`.
- Previous commit on `main`: `38f97e8` (`feat(video): build extension HHTQ Vietsub (hhtq.press) — task 113`).
- Working tree dirty state (metadata only):
  - `M .agents/teamwork/ORIGINAL_REQUEST.md`
  - `?? .agents/teamwork/orchestrator_fqvideo_r1/`
  - `?? .agents/teamwork/sentinel_fqvideo_1/`
  - (plus peer survey agent folders under `.agents/teamwork/`).
- Root directory files: `.agents`, `.github`, `.gitignore`, `AGENTS.md`, `HANDOFF.md`, `LICENSE`, `README.md`, `STATUS.md`, `docs/`, `extension-api.md`, `extension_docs.md`, `extensions/`, `lib/`, `package.json`, `plugin.json`, `repository.json`, `scripts/`, `templates/`, `tools/`, `vbook-vscode-tester/`, `work/`.
- Remote branch naming conventions (`git ls-remote --heads origin`):
  - Standard single-extension branches (~90+ branches): `feature/<slug>` (e.g., `feature/17k`, `feature/jjwxc`, `feature/kakuyomu`, `feature/novelnext`).
  - Task-numbered branches: `feature/<task-id>-<slug>` (e.g., `feature/113-hhtq-vietsub`, `feature/103-shushuwuxs`, `feature/104-build-truyenkimdung-net`).
  - Parallel Antigravity comparison branches: `feature/<slug>-ag` (e.g., `feature/qimao-ag`, `feature/quykhu-ag`).
  - Research branches: `research/fanqie-survey` (`18c4f3b`), `research/stv-504-kychi`.
  - Fix branches: `fix/<slug>` (e.g., `fix/qimao-ratelimit`, `fix/stv-chap`).
- No existing `fqvideo` or `fanqie` extension exists under `extensions/` (verified via `ls -d extensions/*/*`: 121 extensions total; 3 under `extensions/video/`: `hhtqvietsub`, `hoathinh3d`, `hoathinh_ai`).

### 1.3 Complete Reference Template Inspection: `extensions/video/hhtqvietsub/`
All 19 entries inspected verbatim:
1. `extensions/video/hhtqvietsub/plugin.json` (1 line, 1086 bytes):
   - `config`: `DOMAIN` (`mode: "select"`, `default: "https://hhtq.press"`, `values: ["https://hhtq.press"]`), `MIRRORS` (`mode: "input"`, `format: "text"`, `default: ""`).
   - `metadata`: `author: "MuseAi"`, `encrypt: false`, `language: "javascript"`, `locale: "vi_VN"`, `name: "HHTQ Vietsub"`, `nsfw: false`, `regexp: "^https://hhtq\\.press/[^/\\?]+/?$"`, `source: "https://hhtq.press"`, `type: "video"`, `version: 1`, `description` (includes explanation that Darkrai9x base was encrypted and not reused).
   - `script`: `{ "chap": "chap.js", "detail": "detail.js", "genre": "genre.js", "home": "home.js", "search": "search.js", "toc": "toc.js", "track": "track.js" }`.
2. `extensions/video/hhtqvietsub/icon.png`: `PNG image data, 200 x 200, 8-bit/color RGBA, non-interlaced`.
3. `extensions/video/hhtqvietsub/README.md` (69 lines): documents live site structure, script responsibilities, CDN/embed caveats, and CLI test commands.
4. `extensions/video/hhtqvietsub/health.json` (1 line, 283 bytes): `{"cases":[{"name":...,"pattern":...,"url":...}, ...]}` (3 cases: homepage, listing, sample detail page).
5. `extensions/video/hhtqvietsub/test.json` (1 line, 1380 bytes): `{"cases":[...], "note":"..."}` — 8 golden test cases covering `search.js` (keyword), `search.js` (tab path), `detail.js`, `toc.js`, `chap.js`, `track.js`, `genre.js`, `home.js`.
6. `extensions/video/hhtqvietsub/plugin.zip`: built via `scripts/cli.js build`, committed alongside source.
7. `extensions/video/hhtqvietsub/src/config.js` (74 lines):
   - Lines 14–28: Hardcoded `var BASE_URL = "https://hhtq.press";` overridden in `try/catch` by injected `DOMAIN` and `CONFIG_URL` (never declares `var DOMAIN`).
   - Lines 32–73: `parseMirrorList()`, `var MIRROR_LIST = [];`, `MIRRORS` override in `try/catch`, IIFE deduplicating `BASE_URL` out of `MIRROR_LIST`. No `load()` calls inside `config.js`.
8. `extensions/video/hhtqvietsub/src/config-helpers.js` (145 lines, md5 `591d27d410c35249621e4f8c95abed5f` == `lib/config-helpers.js`).
9. `extensions/video/hhtqvietsub/src/fetch-helpers.js` (320 lines, md5 `fb3cb95a583c78144f5dedc591f70eae` == `lib/fetch-helpers.js`).
10. `extensions/video/hhtqvietsub/src/rate-limit.js` (357 lines, md5 `f29af12a4ed798a4acb7129aa201f1f3` == `lib/rate-limit.js`).
11. `extensions/video/hhtqvietsub/src/helper.js` (255 lines): site-specific parsers & API callers (`halimCfg`, `movieItem`, `movieItems`, `nextListUrl`, `fetchEpisodeDoc`, `parseEpisodes`, `fetchPlayerSources`, `parseSources`, `originOf`). Contains NO `load()` calls (expects caller to load `config.js`, `config-helpers.js`, `fetch-helpers.js`, `rate-limit.js` before `helper.js`). Comments follow Rule 12 (`file config.js`, never `load('config.js')`).
12. `extensions/video/hhtqvietsub/src/home.js` (14 lines): static 4-tab array pointing to `search.js` with path inputs (`/last-update`, `/completed`, `/country/trung-quoc`, `/az-list`). Zero fetches.
13. `extensions/video/hhtqvietsub/src/genre.js` (25 lines): static 14-item category list pointing to `search.js`. Zero fetches.
14. `extensions/video/hhtqvietsub/src/search.js` (39 lines): loads 5 helpers (`config.js`, `config-helpers.js`, `fetch-helpers.js`, `rate-limit.js`, `helper.js`), routes `query` starting with `/` or `http` as list path vs keyword search, calls `rateLimitDelay(siteOrigin(), 500, 1200)`, returns `Response.success(items, nextUrl)` or `Response.error(...)`.
15. `extensions/video/hhtqvietsub/src/detail.js` (76 lines): `normalizeUrl(url)`, `rateLimitDelay`, returns `{ name, author, cover, description, detail, url, type: "video", format: "series", ongoing, genres }`.
16. `extensions/video/hhtqvietsub/src/toc.js` (82 lines): fetches episode chunks, deduplicates by URL, returns `[{ name, url, description: "", lock: false, pay: false }]`.
17. `extensions/video/hhtqvietsub/src/chap.js` (35 lines): returns `[{ title: "Server " + ..., data: ... }]` (Step 1 of `chap`→`track`).
18. `extensions/video/hhtqvietsub/src/track.js` (94 lines): Step 2 of `chap`→`track`; `nativeResult(stream, referer)` returns `{ type: "native", data: stream, host: originOf(stream), mimeType: ..., headers: { "Referer": referer }, timeSkip: [] }`; falls back to `autoResult(pageUrl)`. No UA override.

### 1.4 Other `extensions/video/` Extensions & Root `lib/` Inventory
- **`extensions/video/hoathinh3d/`** (v3, `phimapi.com`, JSON API-direct):
  - `src/`: `config.js`, `helper.js`, `home.js`, `genre.js`, `search.js`, `detail.js`, `toc.js`, `chap.js`, `track.js` (lightweight — no `fetch-helpers`/`rate-limit` needed).
  - `chap.js:12-37` reads multi-server API JSON and pushes `{ title: server.server_name, data: m3u8 }`.
  - `track.js:21-59` returns `type: "native"`, `host: originOf(data)` (CDN origin, NOT API host), `mimeType` (`application/x-mpegURL` or `video/mp4`), `headers: { "Referer": BASE_URL + "/" }`, `timeSkip: []`.
- **`extensions/video/hoathinh_ai/`** (v5, `www.dailymotion.com`, JSON API-direct):
  - `src/`: includes `comment.js` (referenced via `detail.js` `comment: { title, input, script: "comment.js" }`) and `config-helpers.js`.
  - `detail.js:71-73` uses `type: "video"`, `format: "stream"`, `ongoing: false`.
  - `chap.js:12-20` passes opaque video ID `{ title: "Dailymotion", data: id }` to `track.js`, which calls `/player/metadata/video/<id>` and returns `type: "native"` with `.m3u8` URL.
- **Root `lib/` helpers (10 files)**:
  1. `lib/config-helpers.js` (5,591 B): `siteOrigin()`, `normalizeUrl(url)`, `absUrl(href)`, `cleanText(s)`, `storyItem(el)`, `storyItems(node, sel)`, `nextPageToken(doc)`, `pagedUrl(url, page)` (requires `config.js` loaded first).
  2. `lib/fetch-helpers.js` (12,640 B): `defaultHeaders(referer)`, `sleepMs(ms)`, `jitterDelay()`, `retryAfterMs(res, attempt)`, `isChallengeText(text)`, `isChallengeDoc(doc)`, `fetchViaBrowser(url)`, `fetchPage(url, opts)`, `docFromResponse(res, url)`, `fetchDoc(url, opts)`, `fetchDocWithFallback(url, mirrors)`, `fetchJson(url, opts)`, `fetchWithFallback(url, mirrors)`.
  3. `lib/rate-limit.js` (16,404 B): `rateLimitDelay(host, minMs, maxMs)`, `shouldRetryStatus(status)`, `backoffMs(attempt, retryAfter)`, `setCooldown(host, ms)`, `cooldownRemainingMs(host)`, `isCoolingDown(host)`, `shouldUseBrowserFallback(status, isChallenge)`, `rateLimitErrorMessage(siteName, host, remainingMs)`, `pacedFetch(url, opts)` (returns `{ ok, status, res, headers, text: null, error, cooldownRemainingMs, attempts }`, supports `method`, `body`, `headers`, `referer`, `minDelayMs`, `maxDelayMs`, `maxRetries`, `cooldownMs`, `timeout`).
  4. `lib/safe-first.js` (1,673 B): `safeFirst(elements)` guarding vBook runtime's non-null `.first()` quirk.
  5. `lib/challenge-handler.js` (9,061 B): Legado-style Cloudflare/login detection + WebView fallback + Vietnamese user instructions.
  6. `lib/cleanHtml.js` (3,742 B): HTML sanitization for novel chapters (`stripTags`, `cleanHtml`).
  7. `lib/crypto.js` (48,297 B): CryptoJS fallback/polyfill (note: at runtime vBook's built-in `crypto.js` takes priority over custom `crypto.js`, per `extension-api.md:1613-1614`).
  8. `lib/gbk.js` (2,589 B): GBK/GB2312 charset helpers (not needed for UTF-8 JSON APIs).
  9. `lib/hanviet.js` (18,265 B): Vietnamese→Chinese syllable map (specific to `ixdzs8`).
  10. `lib/inflate.js` (10,854 B): Pure-JS raw DEFLATE decompressor.

### 1.5 Complete Enumeration of `tools/cli/validate.js` Checks (Zero-Surprise List)
Running `node scripts/cli.js validate` (`tools/cli/validate.js:524-786`) enforces ALL of the following:
1. **(a) Root `plugin.json` valid**: exists, valid JSON, `Array.isArray(registry.data)`; warns if `registry.metadata.author !== "MuseAi"` (lines 538–556).
2. **(b) Catalog ≡ Disk + Branch `main`**: exact 1-to-1 match between every `extensions/<type>/<name>/plugin.json` on disk and `RAW_BASE + "/extensions/" + rel + "/plugin.zip"` in root `plugin.json` (`RAW_BASE = https://raw.githubusercontent.com/qsang2025/Qsang_vbook/main`); every registry `path` must contain `/main/` (lines 569–590).
3. **(c) Version parity**: `String(regEntry.version) === String(meta.version)` (lines 624–630).
4. **(f) Required metadata + strict enums**: `meta.name`, `meta.version`, `meta.source`, `meta.type` ∈ `TYPES`, `meta.locale` ∈ `LOCALES` (`vi_VN`, `zh_CN`, `ja_JP`, `en_US`, `zh_TW`); warns if folder `<type>` ≠ `meta.type` (lines 605–622).
5. **(d) Script map completeness**: `src/` dir exists; every key in `manifest.script` is a non-empty string whose basename exists in `src/` (lines 632–650).
6. **(e) No orphan `.js` files in `src/`**: every `src/*.js` must be in `manifest.script`, OR in `HELPER_NAMES` (`config.js`, `helper.js`), OR in root `lib/`, OR `load()`ed from another `src/*.js` (lines 652–663).
7. **(g) `test.json` schema (if present)**: valid JSON; accepts single case, array, or `{"cases": [...]}`; non-empty; every case has string `script` existing in `src/`, key `input`, key `expect` (lines 398–430, 666–667).
8. **(j) `health.json` schema (if present)**: valid JSON; accepts array or `{"cases": [...]}`; every case has non-empty string `url`; optional `pattern` must compile as `new RegExp(pattern, "i")` (lines 491–522, 670–671).
9. **(i) Rhino ES6 linter + `node --check` + MD5 lib sync + `execute()` + `load()` rules** on every `src/*.js` AND every root `lib/*.js` (lines 673–765):
   - Banned tokens outside strings/comments: `` ` ``, `=>`, `async function`/`await `, `?.`, `??`, `...ident`, `.flat(`/`.flatMap(`.
   - `node --check <file>` must exit 0.
   - If filename exists in root `lib/`, `md5(src/<f>)` MUST equal `md5(lib/<f>)`.
   - Every runnable script (not `config.js`, `helper.js`, or in root `lib/`) MUST match `/\bfunction\s+execute\s*\(/`.
   - Every `load('...')` argument must NOT contain `/` or `\`.
   - `findCommentLoadCalls()` MUST return empty (no `load('...')` in `//` or `/* */` comments — Rule 12).
   - No recursive `load()`: any file targeted by `load()` MUST contain zero `load()` calls.
10. **(h) `plugin.zip` presence, integrity, exact byte parity & no extra zips** (lines 327–396, 735–736, 770–774):
    - `plugin.zip` must exist and parse via valid EOCD + Central Directory.
    - Expected zip entries: `plugin.json`, `icon.png` (if on disk), all files in `src/`, plus any `load()`ed root `lib/` files not already in `src/`.
    - No extra entries, no missing entries, and every inflated entry MUST match disk file byte-for-byte (`content.equals(...)`).
    - Zero other `*.zip` files anywhere under `extensions/`.

### 1.6 `muse-teamwork` Records & Historical Flash Timing Benchmarks
- **Task 113 (`tasks/113-build-extension-hhtq-vietsub-hhtq-press-.json`)**:
  - Branch: `feature/113-hhtq-vietsub`, assignee `muse-1`, merged to `Qsang_vbook` `main` at `38f97e8` (registry 121, validate PASS 0 warnings, device test 8/8 PASS on HONOR PTP-AN10, install 200 OK, review 9/10).
- **Task 116 (`tasks/116-fix-hhtq-vietsub-khong-phat-duoc-track-t.json`, status `claimed`)**:
  - Critical video quality gate: user tapped Play on Episode 1 in app and hit `"Không thể tải máy chủ này. Hãy thử máy chủ khác."` because `track.js` fell back to `type: "auto"` on a rotating JWPlayer embed (`streamc.xyz` / `tenmienphu68.lol`). Recorded house lesson: *"với video, case track trên embed thật phải trả native mới tính là đạt."*
- **Task 108 (`research/108-fanqie-fork-extensions.md`) & Task 109 (`research/109-fanqie-pua-verify.md`)**:
  - Task 108 surveyed 13 Fanqie extensions across 11 forks + 19 catalogs; confirmed `Darkrai9x/vbook-extensions` has zero Fanqie extensions.
  - Entry #12 (`research/108-fanqie-fork-extensions.md:30,73`): **`FQ Video` v3** (`type: "video"`, author `Đường đen`, repo `duongden/vbook` [GPL-3.0], source `fanqienovel.com`, description *"API trực tiếp và phát native; không cần root"*), zip hosted externally on `workers.dev` — code was NOT read in Task 108.
  - Task 109 + remote branch `research/fanqie-survey` (`18c4f3b`) confirmed novel endpoints `/api/reader/full` and `/api/author/search/search_book/v1` trigger ByteDance `bdturing-verify` slide captcha (HTTP 200, 0-byte body) for anonymous guests, whereas `/api/reader/directory/detail?bookId=...` returned HTTP 200 JSON without captcha. (Video/short-drama endpoints are outside novel Task 108/109 scope and are being probed by `spec_miner_fqvideo_api_1`.)
- **Prior Flash (`Gemini 3.8 Flash`) & Muse Reference Timings** (verified directly from GitHub commit timestamps & `muse-teamwork` task files):

| Reference Run | Repo / Branch | Model / Agent | Task Type | Start UTC | End UTC | Elapsed | Source Evidence |
|---|---|---|---|---|---|---|---|
| **QuyKhu Port (AG Flash)** | `Qsang_vbook` `feature/quykhu-ag` | Planner: Gemini 4 Pro Argon; Coord + Exec: **Gemini 3.8 Flash** (`quota-workflow`) | Port novel ext from existing base (`mizhm/vozer`) | `2026-11-11T16:27:38Z` (recon+plan commit `bdbdb7f`) | `2026-11-11T16:35:53Z` (complete commit `90bfad4`) | **8m 15s** | `feature/quykhu-ag` `.agents/plans/2026-11-11-port-quykhu.md` + git commits |
| **Qimao Build (AG Flash)** | `Qsang_vbook` `feature/qimao-ag` | **Gemini 3.8 Flash** (`quota-workflow`, 4 clusters) | Fresh complex API + AES-128-CBC ext (`chinese_novel`) | `2026-11-09T16:14:24Z` (plan commit `3bbdc02`) | `2026-11-09T17:15:03Z` (code+zip+validate `9f8cdf2`) / `17:19:32Z` (report `d6959e7`) | **60m 39s** (code) / **65m 08s** (incl. final report) | `feature/qimao-ag` commits `3bbdc02`→`be6bbe8` (+23m27s)→`8c18fbf` (+26m00s)→`9f8cdf2` (+11m12s)→`d6959e7` (+4m29s) |
| **Fanqie Survey (AG Flash)** | `Qsang_vbook` `research/fanqie-survey` | **Gemini 3.8 Flash** (`quota-workflow`, 3 clusters) | Research survey + live probe logs | `2026-11-11T01:16:23Z` (plan `aa122c4`) | `2026-11-11T01:38:18Z` (final report `18c4f3b`) | **21m 55s** | `research/fanqie-survey` commits `aa122c4`→`18c4f3b` |
| **Muse Review (AG Flash)** | `muse-teamwork` `feature/antigravity-review` | Planner: Argon; Exec: **Gemini 3.8 Flash** | Architecture review report | `2026-11-16T15:09:57Z` (`ad9bb7e`) | `2026-11-16T15:15:23Z` (`d87b39b`) | **5m 26s** | `docs/ANTIGRAVITY-REVIEW.md:125-127`, git commits |
| **HHTQ Vietsub (Muse-1)** | `Qsang_vbook` `feature/113-hhtq-vietsub` | `muse-1` worker (reference video build) | Fresh video ext build + device test + merge | `2026-11-19T18:52:13Z` (claim `d8466af`) | `2026-11-19T19:51:04Z` (code `38f97e8`) / `20:25:14Z` (device test+merge `5e5fa2f`) | **58m 51s** (build) / **~93m 01s** (incl. device test+merge) | `muse-teamwork/tasks/113-*.json` + git commits |
| **Sto66 (Muse-1)** | `Qsang_vbook` `feature/102-build-sto66-com` | `muse-1` worker | Novel ext port | `14:56:48Z` (`21:56:48+07`) | `15:35:00Z` (`22:35:00+07`) | **~38m 12s** | `muse-teamwork/tasks/102-*.json` |
| **TruyenKimDung (Muse-main)** | `Qsang_vbook` `feature/104-build-truyenkimdung-net` | `muse-main` | Novel ext fresh build | `15:10:44Z` (`22:10:44+07`) | `15:39:00Z` (`22:39:00+07`) | **~28m 16s** | `muse-teamwork/tasks/104-*.json` |

- Note from `antigravity-skills/quota-workflow/SKILL.md` (v4.1, commit `beb2fe8` on `2026-11-20`): no formal pre-existing Flash-vs-Hydrogen benchmark report exists in the repo yet (*"Google claims it finishes tasks 2.5× faster than Gemini 3.8 Flash... Live test pending on a real task"*). The verified git commit timelines above (`8m 15s` for Flash port, `60m 39s` for complex Flash fresh API build, `58m 51s` for Muse-1 fresh video build) are the authoritative historical baseline.

---

## 2. Logic Chain

1. **Template choice (`hhtqvietsub` + `hoathinh3d`/`hoathinh_ai` over raw `templates/video/`)**: Observation §1.3 & Edge Case #2 show that `templates/video/` still contains legacy `"author": "Qsang"` and hardcoded `User-Agent` headers in `track.js`, whereas `extensions/video/hhtqvietsub/` (commit `38f97e8`, 2026-11-20) passes every `validate.js` rule with 0 warnings, obeys Rules 9, 10, 11, and 12, and cleanly separates `config.js` + `lib/` + `helper.js` + lifecycle scripts. For JSON API-direct resolution into `type: "native"`, `hoathinh3d/src/{chap,track}.js` and `hoathinh_ai/src/{chap,track}.js` (Observation §1.4) demonstrate the exact minimal `chap` → `track` (`native`, CDN `originOf(stream)` as `host`) pattern.
2. **Mandatory disk copy of `lib/*.js` into `src/`**: Observation §1.5 & Feature #21 show an architectural split: offline `build.js` inlines root `lib/*.js` into a temp folder, while device tester `vbook.js` reads ONLY `src/*.js` on disk. Copying the needed root `lib/*.js` files byte-identically into `extensions/video/fqvideo/src/` (and never modifying them there) ensures both `vbook.js test/install` and `validate.js` MD5 checks pass seamlessly.
3. **Strict `native` playback requirement**: Observation §1.6 (Task 116) proves that `type: "auto"` embed fallbacks can pass automated device script testing (`code: 0`) yet break real video playback in ExoPlayer. Combined with `ORIGINAL_REQUEST.md` § Follow-up item #2 (*"API trực tiếp, phát native"*), `fqvideo/src/track.js` must resolve real direct `.mp4`/`.m3u8` URLs from Fanqie's video API and return `type: "native"` with appropriate `mimeType` and stream `headers` (no UA rotation unless proven necessary by live API probe).
4. **Strict manifest compliance & `locale` selection**: Observation §1.5 (`validate.js:50-51`) enforces underscore locales (`vi_VN`, `zh_CN`, `ja_JP`, `en_US`, `zh_TW`) and exact `author: "MuseAi"`. Since Fanqie (`fanqienovel.com`) hosts Simplified Chinese short dramas and animations, `locale: "zh_CN"` is canonical (unless the reference FQ Video source on phone or user explicitly expects `vi_VN` — verify against `explorer_fqvideo_forks_1` findings).
5. **Clean feature-branch discipline**: Observation §1.2 & §1.5 confirm that `validate.js` and `build-catalog.js` always generate `/main/` registry URLs and ignore `.agents/teamwork/` and root `.md` files. Creating `feature/fqvideo` from `main` (`a761de0`), staging ONLY `extensions/video/fqvideo/` and regenerated root `plugin.json` (never `git add -A`), and running `build` → `build-catalog` → `validate` → `build-catalog --check` guarantees a 0-warning, CI-green branch ready for device testing and later merge.

---

## 3. Caveats

- **Live Fanqie Video API & Fork Reference Outside Our Scope**: Per dispatch, this agent performed a read-only survey of repo rules, skill, template, CLI, and `muse-teamwork`. Exact Fanqie short-drama/animation API endpoints, response JSON schemas, stream URL formats (`.mp4` vs `.m3u8` vs quality list), cover referrer requirements, and whether `duongden/vbook`'s external `vbook.trasua.workers.dev` zip is inspectable or GPL-restricted are being surveyed in parallel by `explorer_fqvideo_forks_1` and `spec_miner_fqvideo_api_1`.
- **Cloud VM Device-Test Limitation**: As documented in `ORIGINAL_REQUEST.md:30`, `VBOOK_SERVER` / `servers.json` is not configured in this Cloud VM (`127.0.0.1:18080` unreachable), so `scripts/cli.js connect/test/testall/install` cannot execute from the VM until a device tunnel/forwarder is attached. Offline `validate`, `build`, `build-catalog --check`, and Node/curl simulation probes of live Fanqie APIs ARE executable locally.
- **`locale` (`zh_CN` vs `vi_VN`) & `format` (`short` vs `series`)**: Fanqie hosts both multi-episode vertical short dramas (`format: "short"` opens vBook's vertical swipe feed) and standard/anime series (`format: "series"`). Confirm from `spec_miner_fqvideo_api_1` / `explorer_fqvideo_forks_1` whether Fanqie's video catalog returns vertical 9:16 dramas (`format: "short"`), horizontal anime (`format: "series"`), or mixed (dynamic `format` per item in `detail.js`!).
- **Prior Flash Timing Comparability**: Historical `feature/qimao-ag` (`60m 39s`) and `feature/quykhu-ag` (`8m 15s`) timings measure git commit spans (first plan commit → final implementation commit), not wall-clock time from initial user message (which adds ~2–5m for pre-plan recon/init). Report both commit-span and total run-start-to-finish elapsed times for an apples-to-apples comparison.
- **No Unverified Claims**: All file paths, line numbers, MD5 hashes, `validate` baseline results, and git timestamps were directly observed via tools in this session.

---

## 4. Conclusion — Concrete Blueprint & Implementation Strategy for `extensions/video/fqvideo/`

### 4.1 Canonical Naming, Branch & Manifest Spec
- **Git Branch**: `feature/fqvideo` branched from `main` (`a761de0`). Do **NOT** merge to `main`.
- **Extension Directory**: `extensions/video/fqvideo/` (matches lowercase slug convention: `hhtqvietsub`, `hoathinh3d`, `hoathinh_ai`).
- **`extensions/video/fqvideo/plugin.json`**:
  - `metadata.name`: `"FQ Video"`
  - `metadata.author`: `"MuseAi"` *(exact string — never append `ref:` here)*
  - `metadata.version`: `1` *(integer)*
  - `metadata.source`: `"https://fanqienovel.com"` *(must match `config.DOMAIN.default`)*
  - `metadata.type`: `"video"`
  - `metadata.locale`: `"zh_CN"` *(verify with fork/API survey; must be in `LOCALES`)*
  - `metadata.language`: `"javascript"`
  - `metadata.encrypt`: `false`
  - `metadata.nsfw`: `false`
  - `metadata.regexp`: whole-URL regex covering verified Fanqie video/short-drama detail URLs (e.g., `^https?://(www\\.)?fanqienovel\\.com/(video|short|page)/.+` — finalize from live URLs verified by `spec_miner_fqvideo_api_1`)
  - `metadata.description`: concise Vietnamese description of FQ Video (phim ngắn + hoạt hình Fanqie, API trực tiếp, phát native; include any pattern attribution here if applicable, never in `author`).
  - `config`:
    - `DOMAIN`: `{ "title": "Domain", "default": "https://fanqienovel.com", "mode": "select", "values": ["https://fanqienovel.com"] }`
    - `MIRRORS`: `{ "title": "Mirror dự phòng (cách nhau bằng dấu phẩy, theo thứ tự ưu tiên)", "default": "", "mode": "input", "format": "text" }`
    - *(Optional if API needs pacing cap)* bare `"thread_num": 2, "delay": 500` (bare JSON numbers, never collide with `src/*.js` variable names).
  - `script`: `{ "home": "home.js", "genre": "genre.js", "search": "search.js", "detail": "detail.js", "toc": "toc.js", "chap": "chap.js", "track": "track.js" }` *(add `"page": "page.js"` ONLY if episode TOC is paginated; do NOT declare `"explore"` alongside `"home"`).*

### 4.2 File-by-File Blueprint (`extensions/video/fqvideo/`)

| File | Role & Implementation Contract |
|---|---|
| `plugin.json` | Manifest per §4.1. Validated JSON, zero key typos. |
| `icon.png` | Real Fanqie / FQ Video logo, decoded PNG resized to `200x200` (≤5 MB). Mandatory before packaging/install. |
| `README.md` | Documents verified live Fanqie video endpoints, stream resolution flow (`chap` → `track` `native`), supported formats (`short` / `series`), rate-limit behavior, attribution (if any), and exact CLI test commands. |
| `health.json` | `{"cases": [...]}` with 2–3 lightweight HTTP GET cases (e.g., `fanqienovel.com` video landing/API endpoint + sample detail/catalog URL with verified regex `pattern`). Must pass `validate.js` regex compilation and return HTTP 200 (or known `BLOCKED` status). |
| `test.json` | `{"cases": [...], "note": "..."}` covering ALL 7+ declared scripts (`home.js`, `genre.js`, `search.js` keyword + list tab, `detail.js`, `toc.js`, `chap.js`, `track.js` on a **real episode track** expecting `["native", "http"]` per Task 116 lesson). Zero tokens/cookies/secrets. |
| `plugin.zip` | Generated strictly by `node scripts/cli.js build extensions/video/fqvideo` AFTER all `src/`, `plugin.json`, and `icon.png` edits are final; committed alongside source. |
| `src/config.js` | Copy structure from `hhtqvietsub/src/config.js`: hardcoded `var BASE_URL = "https://fanqienovel.com";` + `DOMAIN`/`CONFIG_URL` `try/catch` override + `parseMirrorList` + `MIRROR_LIST` + any Fanqie API base URL constants. **Zero `load()` calls.** |
| `src/config-helpers.js` | Exact byte-identical copy of root `lib/config-helpers.js` (MD5 `591d27d410c35249621e4f8c95abed5f`). Provides `siteOrigin`, `normalizeUrl`, `absUrl`, `cleanText`, `pagedUrl`. |
| `src/fetch-helpers.js` | *(Include if using `defaultHeaders` / `isChallengeText` / `fetchJson`)* Exact byte-identical copy of root `lib/fetch-helpers.js` (MD5 `fb3cb95a583c78144f5dedc591f70eae`). |
| `src/rate-limit.js` | Exact byte-identical copy of root `lib/rate-limit.js` (MD5 `f29af12a4ed798a4acb7129aa201f1f3`). Provides `rateLimitDelay`, `pacedFetch`, `rateLimitErrorMessage`, `setCooldown` (Rule 11). |
| `src/helper.js` | Pure Rhino ES6 (`var`/`function`/`+`) Fanqie video API client & parsers: JSON fetch wrapper via `pacedFetch` (detecting empty/Turing captcha responses cleanly with Vietnamese error instead of crashing `JSON.parse`), item card mapper, detail/episode/stream extractors, `originOf(url)`, protocol-relative `//` → `https:` normalizer. **Zero `load()` calls (code OR comments — Rule 12).** |
| `src/home.js` | **Static tabs only, ZERO fetch (Rule 9).** Returns curated tabs (e.g., Phim ngắn hot / Hoạt hình / Mới cập nhật / Bảng xếp hạng per verified Fanqie categories) routing to `search.js` with path/category `input`. |
| `src/genre.js` | Returns Fanqie video/short-drama/animation genres/channels routing to `search.js`. Prefer static list of verified API category IDs/paths (or live API fetch with error guard if dynamic). |
| `src/search.js` | Dual handler: category/tab `input` (e.g., prefixed `cat:` or `/` or `http`) vs keyword search. Uses `pacedFetch`, deduplicates items by `link`, returns `Response.success(items, nextPageString)` (`""` on last page). Returns Vietnamese `Response.error(...)` if search is captcha-blocked or network fails. |
| `src/detail.js` | Normalizes URL, fetches video/series metadata via Fanqie API, returns `{ name, author, cover, description, detail, url, type: "video", format: "short" \| "series", ongoing, genres: [{ title, input, script: "search.js" }], referrerpolicy? }`. Sets `format` accurately (`"short"` for vertical short drama, `"series"` for horizontal/anime series). |
| `src/toc.js` | Fetches full episode list via Fanqie API (with pagination loop inside `toc.js` or via `page.js` if >1 page), deduplicates by URL, returns `[{ name, url, description: "", lock: isLocked, pay: isPay }]` (honor free/locked flags — never bypass VIP/paywall). |
| `src/chap.js` | Step 1 of `chap`→`track`. Fetches episode stream info (or passes opaque episode/video ID JSON to `track.js`). Returns non-empty array `[{ title: "<Quality/Server>", data: "<streamUrl or JSON payload>" }]` with **unique, non-empty titles** (e.g., `"1080P"`, `"720P"`, `"Mặc định"`). Never returns bare string. |
| `src/track.js` | Step 2 of `chap`→`track`. Resolves `data` into `{ type: "native", data: directStreamUrl, host: originOf(directStreamUrl), mimeType: isMp4 ? "video/mp4" : "application/x-mpegURL", headers: { "Referer": ... }, timeSkip: [] }` (plus `subtitles`/`danmaku` if API provides them). Strict priority `native` → `auto` (only if unavoidable) → `Response.error(viMsg)`. Never rotate User-Agent unless proven required. |

### 4.3 Post-Implementation Build, Validation & Git Sequence
1. Ensure working on new branch `feature/fqvideo` cut from `main` (`a761de0`).
2. Build zip offline (after all `src/`, `plugin.json`, `icon.png` edits are complete):
   ```bash
   node scripts/cli.js build extensions/video/fqvideo
   ```
3. Regenerate root catalog `plugin.json` (never hand-edit):
   ```bash
   node scripts/cli.js build-catalog
   ```
4. Run full repo static validation + catalog check (must report `122 nguồn, 122 mục trong registry: PASS (0 cảnh báo)`):
   ```bash
   node scripts/cli.js validate
   node scripts/cli.js build-catalog --check
   ```
5. Verify `health.json` URLs directly (avoid running repo-wide `health-check.js` if you don't want 121 unrelated site probes or untracked `health-check-failures.json`).
6. Stage ONLY extension files + regenerated root `plugin.json` (NEVER `git add -A`; keep `.agents/teamwork/` uncommitted):
   ```bash
   git add extensions/video/fqvideo plugin.json
   git status
   ```
7. Device verification commands (when `VBOOK_SERVER` is reachable on phone):
   ```bash
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js connect
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo home.js
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo genre.js
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo search.js "<query>" ""
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo detail.js "<detail_url>"
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo toc.js "<detail_url>"
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo chap.js "<episode_url>"
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js test extensions/video/fqvideo track.js "<track_data_from_chap>"
   VBOOK_SERVER=http://<ip>:<port> node scripts/cli.js install extensions/video/fqvideo
   ```

---

## 5. Verification Method

Independently verify every observation in this report with these read-only commands from `/home/antigravity/qsang2025/Qsang_vbook`:

1. **Verify dual API contract parity & baseline repo validation**:
   ```bash
   md5sum extension-api.md .agents/skills/vbook-extensions/reference/extension-api.md
   node scripts/cli.js validate
   node scripts/cli.js build-catalog --check
   ```
   - Expected: matching MD5 `982141b2e170b77bbef8f1d4b20cab25`, `PASS (0 cảnh báo)` across 121 sources, `OK: plugin.json khớp với 121 nguồn trên đĩa.`
2. **Verify `hhtqvietsub` lib MD5 parity & icon format**:
   ```bash
   md5sum lib/config-helpers.js extensions/video/hhtqvietsub/src/config-helpers.js \
          lib/fetch-helpers.js extensions/video/hhtqvietsub/src/fetch-helpers.js \
          lib/rate-limit.js extensions/video/hhtqvietsub/src/rate-limit.js
   file extensions/video/hhtqvietsub/icon.png
   ```
3. **Verify `vbook.js` `src/`-only payload behavior & `validate.js` rules**:
   - Inspect `.agents/skills/vbook-extensions/scripts/vbook.js:263-283` and `tools/cli/validate.js:50-53,193-252,327-396,605-774`.
4. **Verify prior Flash & Muse-1 benchmark timings**:
   ```bash
   gh api 'repos/qsang2025/Qsang_vbook/commits?sha=feature/qimao-ag&per_page=10' --jq '.[] | "\(.sha[0:7]) \(.commit.committer.date) \(.commit.message|split("\n")[0])"'
   gh api 'repos/qsang2025/Qsang_vbook/commits?sha=feature/quykhu-ag&per_page=5' --jq '.[] | "\(.sha[0:7]) \(.commit.committer.date) \(.commit.message|split("\n")[0])"'
   cat /home/antigravity/qsang2025/muse-teamwork/tasks/113-build-extension-hhtq-vietsub-hhtq-press-.json
   cat /home/antigravity/qsang2025/muse-teamwork/tasks/116-fix-hhtq-vietsub-khong-phat-duoc-track-t.json
   ```
5. **Invalidation conditions**:
   - Any update to `tools/cli/validate.js` (e.g., adding new `TYPES` or lint rules), `lib/*.js`, `extension-api.md`, or `Qsang_vbook` `main` tip advancing past `a761de0` requires re-checking the affected items before implementation.
