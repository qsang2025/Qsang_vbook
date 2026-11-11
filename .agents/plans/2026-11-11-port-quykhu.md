# Plan: Port vBook Extension QuyKhu (quykhu.com) to Qsang_vbook
- Date: 2026-11-11
- Repo: https://github.com/qsang2025/Qsang_vbook, branch `feature/quykhu-ag`
- Planner: Master Agent (Gemini 4 Pro Argon Planning Mode 2)
- Coordinator: Antigravity Primary Agent (Gemini 3.8 Flash)
- Executor: Antigravity Subagents (Gemini 3.8 Flash)
- Request file: `.agents/plans/2026-11-11-port-quykhu-REQUEST.md`
- Context bundle: `.agents/plans/port-quykhu-CONTEXT.md`

---

## 1. Goal
Port the novel extension "QuyKhu" (for quykhu.com, formerly vozer.io) into `Qsang_vbook` under `extensions/novel/quykhu/`, modernizing it to Qsang_vbook standards: author "MuseAi", locale "vi_VN", full lifecycle scripts, rate-limiting delay, Rhino ES6 compliance, static tabs in home.js, light health probe (`health.json`), golden fixture (`test.json`), and clean validation (`node scripts/cli.js validate` with 30/30 sources and 0 warnings).

---

## 2. Context the Executor Needs

### Repo Layout & Paths
- Target folder: `extensions/novel/quykhu/`
  - `icon.png`: square icon for app
  - `plugin.json`: manifest with metadata, config, script mapping
  - `health.json`: lightweight probe cases for CI
  - `test.json`: golden fixtures for developer server / verification
  - `README.md`: description & attribution
  - `plugin.zip`: generated package with inlined libs (`crypto.js`, `rate-limit.js`)
  - `src/`:
    - `config.js`: base URL, headers, normalization, helpers
    - `home.js`: static navigation tabs
    - `genre.js`: category list
    - `detail.js`: story details, author, status, tags
    - `search.js`: search query handler
    - `page.js`: TOC pagination handler
    - `toc.js`: chapter list extractor
    - `chap.js`: chapter decryptor (XOR + Base64 via CryptoJS)
    - `gen.js`: listing handler for home tabs and genre filters
- Shared libraries in `lib/`:
  - `lib/rate-limit.js`: `rateLimitDelay(host, minMs, maxMs)`
  - `lib/crypto.js`: CryptoJS for Base64 and WordArray decoding

### Mandatory House Rules (`AGENTS.md`)
1. **Source of Truth**: `src/` is the single source of truth. Never edit `plugin.zip` or root `plugin.json` directly.
2. **Author Format**: Strictly `"author": "MuseAi"`. Attribution (`ref: mizhm`) belongs strictly in `description`.
3. **Locale & Type**: Strictly `"locale": "vi_VN"`, `"type": "novel"`, `"encrypt": false`.
4. **Rhino ES6 Constraint**:
   - Only `var`, `function`, string concatenation with `+`.
   - Canned/Forbidden: `let`, `const`, arrow functions `() => {}`, template literals `` ` `` , `?.`, `??`, spread `...`, `async/await`.
5. **No `load('...')` in Comments**: Runtime regex treats commented loads as real loads (STV v7 regression). Never write `load('...')` in comments.
6. **Static Home**: `home.js` must return static tabs without fetching external URLs.
7. **Pacing**: Call `rateLimitDelay()` before network requests.
8. **Vietnamese Errors**: Use `Response.error("...")` in clear Vietnamese, never `return null`.
9. **Branch Isolation**: Work ONLY on `feature/quykhu-ag`. NEVER merge to `main`, NEVER touch `feature/quykhu`.

### Verified Technical Facts for quykhu.com
- **WAF / Cloudflare**: Requires `"Accept-Language": "vi-VN,vi;q=0.9"`. Missing this header causes HTTP 403.
- **CSRF & Sessions**: QuyKhu binds CSRF token (`meta[name=csrf-token]`) and cookies (`XSRF-TOKEN`, `quykhu_sess_v3`) for POST `/post/{id}/chapters`.
- **Chapter Content**: Delivered as XOR-encrypted base64 payload via `/post/{id}/chapter-content/{chapId}` requiring `X-CSRF-TOKEN` and `X-Content-Token`. Key and encrypted string are decrypted with CryptoJS.
- **TOC Pagination**: Large books have pagination `/post/{id}/chapters?page=N`. Mizhm generates direct chapter links (`/chuong-{n}`) for later pages after fetching page 1.

---

## 3. Execution Steps

### Step 0: Sync & Check Assumptions
- **What to do**:
  1. Commit the REQUEST, CONTEXT, and PLAN files to `feature/quykhu-ag`.
  2. Verify current git branch is `feature/quykhu-ag`.
  3. Verify `node scripts/cli.js validate` currently passes for existing 29 sources.
- **Expected result**: Working branch clean, commit created, baseline 29 sources pass validate.
- **Verification**: `git status`, `git branch --show-current`, `node scripts/cli.js validate`.
- **Done when**: Commit made and git tree is clean.

### Step 1: Initialize QuyKhu Extension Directory & Manifests
- **What to do**:
  1. Create `extensions/novel/quykhu/` and `extensions/novel/quykhu/src/`.
  2. Copy icon from `/home/antigravity/qsang2025/vbook-extensions_mizhm/vozer/icon.png` to `extensions/novel/quykhu/icon.png`.
  3. Create `extensions/novel/quykhu/plugin.json`:
     - Metadata:
       - `name`: `"QuyKhu"`
       - `author`: `"MuseAi"`
       - `version`: 1
       - `source`: `"https://quykhu.com"`
       - `regexp`: `"^https?://(vozer\\.io|quykhu\\.com)/.*"`
       - `description`: `"QuyKhu (Vozer) — tổng hợp truyện Voz: truyện ma, tâm linh, hồi ký, tình cảm Voz huyền thoại. (Ref: mizhm v6)."`
       - `locale`: `"vi_VN"`
       - `language`: `"javascript"`
       - `type`: `"novel"`
       - `encrypt`: false
     - Script map:
       - `home`: `"home.js"`
       - `genre`: `"genre.js"`
       - `detail`: `"detail.js"`
       - `search`: `"search.js"`
       - `page`: `"page.js"`
       - `toc`: `"toc.js"`
       - `chap`: `"chap.js"`
       - `gen`: `"gen.js"`
     - Config:
       - `DOMAIN`: select between `https://quykhu.com` and `https://vozer.io`
  4. Create `extensions/novel/quykhu/health.json`:
     - Case 1: Trang chủ (`url`: `"https://quykhu.com/"`, `pattern`: `"QuyKhu|Vozer"`).
     - Case 2: Truyện mẫu (`url`: `"https://quykhu.com/nguoi-khong-so-ma-235/"`, `pattern`: `"Người Không Sợ Ma"`).
  5. Create `extensions/novel/quykhu/test.json`:
     - Golden fixtures testing `home.js`, `detail.js`, `toc.js`, `chap.js`, `search.js`.
  6. Create `extensions/novel/quykhu/README.md`.
- **Verification**: Check JSON syntax of `plugin.json`, `health.json`, `test.json`.
- **Done when**: Files created and valid JSON.

### Step 2: Implement Refactored Scripts in `src/` (Rhino ES6)
- **What to do**:
  Implement all 9 scripts in `extensions/novel/quykhu/src/`:
  1. `config.js`:
     - Base URL handling with fallback to `https://quykhu.com`.
     - Standard headers with `Accept-Language: vi-VN,vi;q=0.9`.
     - `rateLimitDelay()` pacing before network requests.
     - `normalizeUrl(url)`.
     - `request(url, options)` handling 429 backoff.
     - `fetchHtml(url)` and `parseCards(doc)`.
     - `saveCsrf(doc)`, `postChapters(endpoint, page, token)`, `chapterLinks(html)`, `chapterEndpoint(doc)`.
     - Strict Rhino ES6: `var` only, no `let`/`const`, no comments containing `load('...')`.
  2. `home.js`:
     - Pure static tabs returning `Response.success([...])`:
       - "Nổi bật" -> `BASE_URL + "/"`
       - "Hoàn thành" -> `BASE_URL + "/hoan-thanh"`
       - "Yêu thích" -> `BASE_URL + "/yeu-thich"`
       - "Xem nhiều" -> `BASE_URL + "/xem-nhieu"`
       - "Mới nhất" -> `BASE_URL + "/moi-nhat"`
       (All routed to `gen.js`).
  3. `genre.js`:
     - `load("config.js");`
     - Fetches `BASE_URL`, extracts `.qk-cat-menu__item`, returns `Response.success(data)`.
     - Error returns `Response.error("Không thể tải danh sách thể loại")`.
  4. `gen.js`:
     - `load("config.js");`
     - Handles pagination and card parsing.
  5. `search.js`:
     - `load("config.js");`
     - Searches via `BASE_URL + "/search?keyword=" + encodeURIComponent(key) + "&page=" + page`.
  6. `detail.js`:
     - `load("config.js");`
     - Extracts title, cover, author, description, tags, status.
     - Vietnamese error on failure.
  7. `page.js`:
     - `load("config.js");`
     - Chapter pagination extractor using CSRF and endpoint.
  8. `toc.js`:
     - `load("config.js");`
     - Extracts chapters from given page URL or story URL.
  9. `chap.js`:
     - `load("config.js");`
     - `load("crypto.js");`
     - Fetches chapter HTML, extracts `contentUrl` and `contentToken`, calls chapter-content endpoint with headers, decrypts using XOR + Base64 via CryptoJS.
     - Clean text filtering (`<img...>` removal, formatting).
     - Clear Vietnamese error strings.
- **Verification**: Run `node --check` on every `.js` file in `src/`. Check for no `const`, `let`, arrow functions, or `load('...')` in comments.
- **Done when**: All scripts parse cleanly in Node and adhere to Rhino ES6.

### Step 3: Package, Build Catalog & Validate
- **What to do**:
  1. Run `node scripts/cli.js build extensions/novel/quykhu` to inline `crypto.js` and `rate-limit.js` and create `plugin.zip`.
  2. Run `node scripts/cli.js build-catalog` to register QuyKhu in root `plugin.json`.
  3. Run `node scripts/cli.js validate`.
- **Expected result**:
  - `validate` passes with 30 sources (29 existing + 1 QuyKhu) and 0 errors / 0 warnings.
- **Verification**: Output of `node scripts/cli.js validate` exits 0.
- **Done when**: 30 sources validated with zero errors.

### Step 4: Final Git Check & Commit
- **What to do**:
  1. Inspect `git status` and `git diff`.
  2. Ensure `.agents/plans/` and `.agents/reports/` are preserved on branch `feature/quykhu-ag`.
  3. Commit with descriptive message: `feat(novel): port QuyKhu extension (quykhu.com)`.
  4. Push branch `feature/quykhu-ag` to origin.
- **Verification**: `git log -1`, `git status`.
- **Done when**: Branch pushed successfully.

---

## 4. Risks & Fallbacks
- **Risk 1: Cloudflare / WAF 403 on quykhu.com**:
  - *Mitigation*: The Recon phase confirmed `Accept-Language: vi-VN,vi;q=0.9` bypasses LiteSpeed 403. If direct fetching fails in CI, `health.json` handles probe, and offline validate does not require network. Live testing on real devices will use mobile network.
- **Risk 2: Linter Rhino ES6 fails on CryptoJS**:
  - *Mitigation*: `lib/crypto.js` in Qsang_vbook is already verified ES5-compliant. The build CLI automatically copies it into `src/` upon packaging.
- **Risk 3: Accidentally merging or touching other branches**:
  - *Mitigation*: Hard constraint: only commit to `feature/quykhu-ag`.

---

## 5. Definition of Done (Final Checklist)
- [x] Directory `extensions/novel/quykhu/` exists with all required files.
- [x] Author is `"MuseAi"`, locale is `"vi_VN"`, type is `"novel"`.
- [x] No `load('...')` inside comments anywhere.
- [x] Strict Rhino ES6 syntax throughout `src/*.js`.
- [x] `node scripts/cli.js validate` passes with 30 sources, 0 warnings.
- [x] `extensions/novel/quykhu/plugin.zip` built and committed.
- [x] Root `plugin.json` updated via `build-catalog`.
- [x] All commits on branch `feature/quykhu-ag`.

---

## 6. Progress
- [x] Step 0 — Baseline verified (29 sources clean). REQUEST & CONTEXT written.
- [x] Step 1 — Initialize directory, manifest, health, test fixtures.
- [x] Step 2 — Implement Rhino ES6 scripts in `src/`.
- [x] Step 3 — Build zip, build-catalog, run validate (30 sources PASS, 0 warnings).
- [x] Step 4 — Commit & push `feature/quykhu-ag`.

---

## 7. Decisions Made During Execution
- 2026-11-11: Mizhm's `vozer/` selected as primary base over kychitoge's `kychi_quykhu` due to direct HTTP API and XOR decryption without requiring heavy WebView `Engine.newBrowser()`.
- 2026-11-11: Required header `"Accept-Language": "vi-VN,vi;q=0.9"` embedded into `config.js` to ensure WAF compatibility on quykhu.com.
