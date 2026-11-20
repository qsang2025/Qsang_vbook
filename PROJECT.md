# Project: FQ Video (`extensions/video/fqvideo`)

- **Request Scope**: `ORIGINAL_REQUEST.md` § `Follow-up — 2026-11-20T02:11:43Z` (strictly the FQ Video task).
- **Target Repository**: `/home/antigravity/qsang2025/Qsang_vbook` (MIT License).
- **Git Branch**: `feature/fqvideo` branched from `main` (`a761de0`). **Do NOT merge into `main`.**
- **Decision Basis**: Step 0 Survey (`explorer_fqvideo_forks_1`, `spec_miner_fqvideo_repo_1`, `spec_miner_fqvideo_api_1`).

## Architecture

### Fork & License Decision: BUILD NEW Clean-Room
- Across 47+ vBook community repositories, `Qsang_vbook`, `vbook-extensions_Darkrai9x`, and global GitHub code search, **`duongden/vbook` is the ONLY vBook fork listing `FQ Video` (`type: "video"`)**.
- Porting from `duongden/vbook` is doubly blocked: (1) `duongden/vbook` is **GPL-3.0** (incompatible with MIT `Qsang_vbook`), and (2) no source exists in the repo — its external zip (`vbook.trasua.workers.dev`) has `"encrypt": true` with all 15 `src/*.js` encrypted ciphertext.
- Therefore, `extensions/video/fqvideo` is built **clean-room under MIT**, following `extensions/video/hhtqvietsub/` (Task 113) + `extensions/video/hoathinh3d/` + `AGENTS.md` + `extension-api.md`.

### Direct API & Native Playback Architecture
- **Shared ByteDance Catalog**: `https://hongguoduanju.com` (official ByteDance Fanqie/Hongguo video web portal) shares the exact `series_id` / `bookId` and `vid` / `itemId` namespace with `https://fanqienovel.com/api/reader/directory/detail?bookId=<id>`.
- **Zero Auth / Zero Signing / Zero Proxy / Pure Rhino ES6**:
  - **Discovery / Home (`home.js`)**: Static tabs (zero fetch, `AGENTS.md` §6.9) covering Live-Action Short Drama (`real-drama`), Comic-Drama / Animation (`comic-drama` 漫剧), AI Animation (`ai-drama` AI剧), and Rankings (`hot-real-drama`, `hot-comic-drama`, `hot-ai-drama`, `hot-drama`), all delegated to `search.js`.
  - **Genre (`genre.js`)**: Static category tabs (zero fetch) covering sub-genres of `real-drama` (24 topics), `comic-drama` (8 topics), and `ai-drama` (8 topics). Excludes `/category/comic` (static manga, non-video).
  - **Search & List (`search.js`)**: Dual-mode handler:
    - List/Rank/Category inputs (`/...` or `http...`): `GET https://hongguoduanju.com/rank/<slug>?page=<N>` and `GET https://hongguoduanju.com/category/<type>[/<topic>]?page=<N>`, parsing `window._ROUTER_DATA`.
    - Keyword search: `GET https://hongguoduanju.com/api/search/result?query=<q>&page=<N>` with `Referer: https://hongguoduanju.com/search` (1–30 char guard; handles HTTP 403 `search_verification_required` gracefully).
  - **Detail (`detail.js`)**: Accepts both `hongguoduanju.com/detail?series_id=<id>`, `hongguoduanju.com/player/<id>`, and reference-compatible `(fanqienovel|fqnovel|snssdk|changdunovel).com/page/<id>?fq_type=(short|animation)`. Fetches `GET https://hongguoduanju.com/detail?series_id=<id>` and returns `type: "video"`, `format: "series"`, metadata, tags as `genres`, and clear note on web Ep 1–5 public availability.
  - **TOC (`toc.js`)**: Fetches episode list (`vid_list` + `accessible_episode_cnt` from `hongguoduanju.com/detail?series_id=<id>`, optionally enriched with exact Chinese episode titles from `GET https://fanqienovel.com/api/reader/directory/detail?bookId=<id>` with clean fallback to `"第N集"`). Sets `lock: (index >= accessible_episode_cnt)` cleanly so locked episodes are transparently indicated.
  - **Playback (`chap.js` → `track.js`)**:
    - `chap.js` parses `series_id` + `item_id` and returns track choices with unique non-empty titles carrying opaque JSON payloads (`{ seriesId, itemId, mode }`) so `track.js` resolves fresh unexpired CDN URLs on demand.
    - `track.js` calls `POST https://hongguoduanju.com/api/video/protected/play-info` (`definition: "720p"`) first for `"hd"` mode: if `legacy_play_info.main_url` is returned (unencrypted 720p H.264+AAC MP4 `er=0` for Comic-Drama & AI-Drama), uses it immediately; otherwise seamlessly calls `POST https://hongguoduanju.com/api/video/protected/fallback-play-info` (`{"item_id": itemId}`) returning unencrypted full-length muxed H.264+AAC MP4 (`er=0`) for Live-Action Short Drama & fallback.
    - Returns `{ type: "native", data: streamUrl, host: originOf(streamUrl), mimeType: "video/mp4", headers: { "Referer": "https://hongguoduanju.com/" }, timeSkip: [] }`.
    - **NEVER** uses SEO `/video/public/<vid>/360p.mp4` (10s preview trap). **NEVER** rotates User-Agent.
    - **Ep 6+ Gate Handling (Honest, Zero DRM/Paywall Bypass)**: Public web API returns HTTP 403 (`public_fallback_unavailable` / `protected_playback_unavailable`) for Ep > `accessible_episode_cnt` (5). Mobile app APIs (`fqnovel.com` / `snssdk.com`) silently drop unsigned requests (`HTTP 200 / 0 B`) and require proprietary ByteDance `X-Argus`+`X-Ladon`/`X-Medusa`+`X-Helios` signing + `spade_a` CENC key unwrapping. Per `AGENTS.md` (MIT clean-room, no DRM bypass, no hardcoded tokens), Ep 6+ returns a clear Vietnamese `Response.error(...)`.

## Feature Inventory

Every Survey feature is assigned to Milestone M1 (single-cycle scope, Step 1 → Yes → Step 2B):

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Git branch isolation | Create new branch `feature/fqvideo` from `main` (`a761de0`); selective staging ONLY (`extensions/video/fqvideo` + root `plugin.json`); do NOT merge to `main` | M1 | `ORIGINAL_REQUEST.md`, `spec_miner_fqvideo_repo_1` |
| 2 | Manifest `plugin.json` | `name: "FQ Video"`, `author: "MuseAi"`, `version: 1`, `source: "https://fanqienovel.com"`, `locale: "zh_CN"`, `type: "video"`, `language: "javascript"`, `encrypt: false`, `nsfw: false`, dual-domain `regexp`, `config` (`DOMAIN`, `VIDEO_DOMAIN`, `MIRRORS`, `thread_num: 1`, `delay: 2000`), full 7-script map | M1 | `spec_miner_fqvideo_repo_1`, `explorer_fqvideo_forks_1`, `spec_miner_fqvideo_api_1` |
| 3 | Official `icon.png` | 200×200 PNG derived from official public `fanqienovel.com` / `hongguoduanju.com` logo/favicon (NOT placeholder, NOT copied from `duongden/vbook`) | M1 | `spec_miner_fqvideo_repo_1` |
| 4 | Config & byte-identical `lib/` inline | `src/config.js` (no `load()`, no `var` collision with config keys) + byte-identical copies of `lib/config-helpers.js`, `lib/fetch-helpers.js`, `lib/rate-limit.js` in `src/` (MD5 parity + Rule 12 zero comment `load()`) | M1 | `spec_miner_fqvideo_repo_1` |
| 5 | Shared API helper (`src/helper.js`) | Pure Rhino ES6 (`var`/`function`/`+`), zero `load()`, `_ROUTER_DATA` extractor, paced JSON/HTML fetch via `rate-limit.js`, `extractSeriesId`, `originOf`, video card mapper, Vietnamese error/captcha/rate-limit messages | M1 | `spec_miner_fqvideo_repo_1`, `spec_miner_fqvideo_api_1` |
| 6 | Static Home tabs (`src/home.js`) | Zero-fetch static tabs covering Phim ngắn (`real-drama`), Hoạt hình / Mạn kịch (`comic-drama`), Hoạt hình AI (`ai-drama`), and Rankings (`hot-real-drama`, `hot-comic-drama`, `hot-ai-drama`, `hot-drama`), routed to `search.js` | M1 | `spec_miner_fqvideo_repo_1`, `spec_miner_fqvideo_api_1` |
| 7 | Static Genre list (`src/genre.js`) | Zero-fetch static categories covering verified sub-genres of `real-drama` (24), `comic-drama` (8), `ai-drama` (8), excluding static manga `/category/comic`, routed to `search.js` | M1 | `spec_miner_fqvideo_repo_1`, `spec_miner_fqvideo_api_1` |
| 8 | Dual-mode Search & Browse (`src/search.js`) | Handles both path inputs (`/rank/...`, `/category/...` with `?page=N`) AND keyword search (`GET /api/search/result?query=<q>&page=<N>`, `Referer: https://hongguoduanju.com/search`, 1–30 char guard, HTTP 403 captcha handling, dedup, string `next` token) | M1 | `spec_miner_fqvideo_api_1`, `spec_miner_fqvideo_repo_1` |
| 9 | Video Detail (`src/detail.js`) | Parses `series_id` from `hongguoduanju.com` or `fanqienovel.com/page/<id>?fq_type=...`; returns `{ name, author, cover, description, detail, url, type: "video", format: "series", ongoing, genres }`; handles invalid ID HTTP 500 gracefully | M1 | `spec_miner_fqvideo_api_1`, `spec_miner_fqvideo_repo_1`, `explorer_fqvideo_forks_1` |
| 10 | Episode TOC (`src/toc.js`) | Lists all episodes via `hongguoduanju.com/detail?series_id=<id>` (enriched with titles from `fanqienovel.com/api/reader/directory/detail?bookId=<id>` when available); marks `lock: (idx >= accessible_episode_cnt)`; emits canonical `/player/<series_id>/<vid>` URLs | M1 | `spec_miner_fqvideo_api_1`, `spec_miner_fqvideo_repo_1` |
| 11 | Track List (`src/chap.js`) | Step 1 of `chap`→`track`: returns array of tracks with unique non-empty titles (`[{ title, data }]`) encoding opaque JSON `{ seriesId, itemId, mode }` so `track.js` fetches fresh unexpired stream URLs; never returns bare string | M1 | `spec_miner_fqvideo_repo_1`, `spec_miner_fqvideo_api_1` |
| 12 | Native Stream Resolver (`src/track.js`) | Step 2 of `chap`→`track`: resolves on-demand via `play-info` (`legacy_play_info.main_url` 720p MP4 for Comic/AI Drama) → `fallback-play-info` (`main_url` muxed MP4 for Short Drama & fallback); returns `{ type: "native", data, host: originOf(data), mimeType: "video/mp4", headers: { "Referer": "https://hongguoduanju.com/" }, timeSkip: [] }`; clean Vietnamese `Response.error` on Ep 6+ HTTP 403; never uses 10s SEO preview | M1 | `spec_miner_fqvideo_api_1`, `spec_miner_fqvideo_repo_1` |
| 13 | Fixtures & Docs (`test.json`, `health.json`, `README.md`) | `test.json` covering all 7 scripts (including `track.js` native assertion for both short drama & comic-drama); `health.json` with lightweight HTTP 200 cases & valid regex; `README.md` documenting clean-room decision, API flow, Ep 1–5 vs Ep 6+ note, and device test CLI commands | M1 | `spec_miner_fqvideo_repo_1`, `spec_miner_fqvideo_api_1` |
| 14 | Build, Catalog, Validate & Offline E2E Harness | Run `scripts/cli.js build extensions/video/fqvideo`, `build-catalog`, `validate` (PASS, 0 warnings, 122/122), `build-catalog --check` (OK), plus live temp-dir Node vBook-runtime harness testing all 7 scripts + live MP4 Range probes + `health.json` URL checks | M1 | `spec_miner_fqvideo_repo_1`, `ORIGINAL_REQUEST.md` |
| 15 | Honest Device Test Status & Timing Report | Document verified `VBOOK_SERVER` unavailability in VM (zero fabricated device test claims) and exact UTC timings + subagent models for comparison with prior Flash runs | M1 | `ORIGINAL_REQUEST.md`, `spec_miner_fqvideo_api_1`, `spec_miner_fqvideo_repo_1` |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Build & Verify `extensions/video/fqvideo` | Full clean-room FQ Video extension on branch `feature/fqvideo` (Features #1–#15), packaged `plugin.zip`, regenerated root `plugin.json`, passing `validate` + live offline E2E verification + 2 Reviewers + 2 Challengers + Forensic Auditor gate | Survey (done) | IN_PROGRESS |

## Interface Contracts

### `home.js` / `genre.js` ↔ `search.js`
- `home.js` & `genre.js` return `Response.success([{ title: string, input: string, script: "search.js" }, ...])` with zero network calls.
- `input` values are path strings starting with `/` (e.g., `/rank/hot-real-drama`, `/category/comic-drama`, `/category/real-drama/fantasy`).
- `search.js` `execute(query, page)`:
  - If `query` starts with `/` or `http`: list/rank/category browse mode (`page` empty/1 → page 1, else integer page string).
  - Otherwise: keyword search mode (`GET https://hongguoduanju.com/api/search/result?query=<encoded>&page=<pageNum>`).
  - Returns `Response.success([{ name, cover, link, description, tag, host }], nextPageString)` where `nextPageString` is `""` when no next page exists, and `link` is `https://hongguoduanju.com/detail?series_id=<id>`.

### `search.js` ↔ `detail.js` ↔ `toc.js`
- `detail.js` `execute(url)` and `toc.js` `execute(url)` both accept any URL matching `metadata.regexp` (including `https://hongguoduanju.com/detail?series_id=<id>`, `https://hongguoduanju.com/player/<id>/<vid>`, and `https://fanqienovel.com/page/<id>?fq_type=(short|animation)`).
- `detail.js` returns `Response.success({ name, author, cover, description, detail, url, type: "video", format: "series", ongoing, genres: [{ title, input, script: "search.js" }] })`.
- `toc.js` returns `Response.success([{ name, url, description, lock, pay }])` where `url` is `https://hongguoduanju.com/player/<series_id>/<vid>` and `lock: (idx >= accessible_episode_cnt)`.

### `toc.js` ↔ `chap.js` ↔ `track.js`
- `chap.js` `execute(episodeUrl)` extracts `{ seriesId, itemId }` from `https://hongguoduanju.com/player/<series_id>/<vid>` and returns:
  - `Response.success([{ title: "HD Trực tiếp (Tự động)", data: JSON.stringify({ seriesId, itemId, mode: "hd" }) }, { title: "MP4 Tiêu chuẩn (Dự phòng)", data: JSON.stringify({ seriesId, itemId, mode: "fallback" }) }])` (or `Response.error(viMsg)` if invalid episode URL).
- `track.js` `execute(data)` parses JSON `{ seriesId, itemId, mode }` (also accepts raw `player/<series>/<vid>` URL if invoked directly), calls `play-info` (`definition: "720p"`) / `fallback-play-info` via `pacedFetch`, and returns:
  - `Response.success({ type: "native", data: streamUrl, host: originOf(streamUrl), mimeType: "video/mp4", headers: { "Referer": videoBaseUrl() + "/" }, timeSkip: [] })`
  - On HTTP 403 (`public_fallback_unavailable` / `protected_playback_unavailable`), returns Vietnamese `Response.error(...)` explaining the public web 5-episode cap.

## Code Layout

- Branch: `feature/fqvideo` (in `/home/antigravity/qsang2025/Qsang_vbook`)
- Exclusive Worker Write Ownership:
  - `extensions/video/fqvideo/plugin.json`
  - `extensions/video/fqvideo/icon.png`
  - `extensions/video/fqvideo/README.md`
  - `extensions/video/fqvideo/health.json`
  - `extensions/video/fqvideo/test.json`
  - `extensions/video/fqvideo/plugin.zip` (generated via `node scripts/cli.js build extensions/video/fqvideo`)
  - `extensions/video/fqvideo/src/config.js`
  - `extensions/video/fqvideo/src/config-helpers.js` (byte-identical to `lib/config-helpers.js`)
  - `extensions/video/fqvideo/src/fetch-helpers.js` (byte-identical to `lib/fetch-helpers.js`)
  - `extensions/video/fqvideo/src/rate-limit.js` (byte-identical to `lib/rate-limit.js`)
  - `extensions/video/fqvideo/src/helper.js`
  - `extensions/video/fqvideo/src/home.js`
  - `extensions/video/fqvideo/src/genre.js`
  - `extensions/video/fqvideo/src/search.js`
  - `extensions/video/fqvideo/src/detail.js`
  - `extensions/video/fqvideo/src/toc.js`
  - `extensions/video/fqvideo/src/chap.js`
  - `extensions/video/fqvideo/src/track.js`
  - `plugin.json` (root catalog — regenerated ONLY via `node scripts/cli.js build-catalog`)
- Untracked Coordination Metadata (NEVER stage or commit to git):
  - `PROJECT.md`
  - `.agents/teamwork/**`
