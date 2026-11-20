# Handoff Report — `spec_miner_fqvideo_api_1` (Live Fanqie Video API & Stream Protocol)

- **Agent**: `spec_miner_fqvideo_api_1` (Spec Miner — Read-Only Live API & Stream Protocol Survey)
- **Dispatched by**: Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`)
- **Scope**: `ORIGINAL_REQUEST.md` → `## Follow-up — 2026-11-20T02:11:43Z` (Requirement #2: *"Loại VIDEO: phim ngắn + hoạt hình Fanqie, API trực tiếp, phát native"*)
- **UTC Start Time**: `2026-11-20T02:16:06Z`
- **UTC End Time (Probing & Cleanup Verified)**: `2026-11-20T02:41:25Z`
- **Elapsed Time**: `25m 19s` (`1519s`)
- **Handoff Type**: **Hard** (Task complete; strictly read-only on repo; zero 405/429 rate-limit triggers; scratch dir verified removed)

> **Executive Summary (CRITICAL GO/NO-GO FINDING)**:
> Empirically probing all live ByteDance/Fanqie/Hongguo video surfaces from this VM (`2026-11-20`) revealed a sharp architectural split between two distinct surfaces sharing the exact same ByteDance `series_id` / `itemId` video catalog:
>
> 1. **Surface A — Public Web JSON & SSR API (`https://hongguoduanju.com` + `https://fanqienovel.com/api/reader/directory/detail`) — 100% UNSIGNED, 100% PURE RHINO ES6, ZERO SIGNING/COOKIES/LOGIN, REAL FULL-LENGTH UNENCRYPTED NATIVE `.mp4` STREAMS — BUT CAPPED AT FIRST 5 EPISODES PER SERIES (`accessible_episode_cnt: 5`)**:
>    - Works out of the box with plain vBook `fetch()` for **Home**, **4 Rankings**, **3 Video Categories** (`real-drama` live-action short drama [24 sub-genres], `comic-drama` 漫剧 animation [8 sub-genres], `ai-drama` AI animation [8 sub-genres], 800 items each), **Real Paginated Search** (`GET /api/search/result?query=<q>&page=<N>`), **Detail**, and **Full TOC** (`vid_list` + `fanqienovel.com/api/reader/directory/detail?bookId=<id>`).
>    - **`POST /api/video/protected/play-info`** (`definition: "720p"`) returns **100% unencrypted 720p H.264+AAC MP4 (`legacy_play_info.main_url`, `er=0`)** for Comic-Drama & AI-Drama (verified live `HTTP 206`, `21.08 MB`, `115.868s`, `['ftyp','moov','mvhd','avc1','mp4a']`), and **720p/480p/360p CENC DASH (`play_info`, `er=1`, `kid` + `player_access_key`)** for Live-Action Short Drama.
>    - **`POST /api/video/protected/fallback-play-info`** (`{"item_id": "..."}`) returns **100% unencrypted full-length muxed H.264+AAC MP4 (`er=0`)** for **BOTH** Live-Action Short Drama (verified `HTTP 206`, `17.52 MB`, `178.966s`) AND Comic-Drama (verified `HTTP 206`, `10.80 MB`, `115.868s`).
>    - **Strict Referer Policy Verified**: `qznovelvod.com` returns `HTTP 206` with **no Referer** or **`Referer: https://hongguoduanju.com/`**, and **`HTTP 403`** with any third-party Referer.
>    - **SEO Trap Avoided**: `VideoObject.contentUrl` (`/video/public/<id>/360p.mp4`) is ONLY a **10.000s 360p preview** (`mvhd dur=10000/1000`). Do NOT use it!
>    - **CRITICAL LIMITATION**: Across all 72 sampled items, **Episodes 1–5** play full-length (`HTTP 200`), while **Episode 6+** return **`HTTP 403`** (`{"error":"public_fallback_unavailable"}` / `{"error":"protected_playback_unavailable"}`) because ByteDance gates Ep 6+ on web behind its mobile app.
>
> 2. **Surface B — Mobile App API (`api5-normal-sinfonline{a,b,c}.fqnovel.com`, `api5-normal-lf.fqnovel.com`, `reading.snssdk.com`, `novel.snssdk.com`) — SERVES ALL EPISODES (1..N, `pay_type: 0`) IN OFFICIAL APP, BUT REQUIRES PROPRIETARY BYTEDANCE SIGNING + CENC DRM**:
>    - Anonymous device registration (`POST https://log.snssdk.com/service/2/device_register/` with plain JSON, **without** `tt_data=a`) **SUCCEEDS (`HTTP 200`)** for both `aid=1967` (Fanqie Novel) and `aid=8662` (Hongguo Short Drama).
>    - However, **every tested `fqnovel.com` / `snssdk.com` App API endpoint** returns silent **`HTTP/2 200` with `Content-Length: 0` + `x-agw-info` + `server-timing: tt_agw`** when called unsigned (with or without registered device IDs) or with `X-Gorgon`+`X-Khronos` alone.
>    - Corroborated by live headers, November 2026 ByteDance protocol analyses (`aston314/hongguo-tv`), and reference `FQ Video` v3's manifest (`video_sign.js` [21 KB], `video_dash.js` [20 KB], `video_cenc.js` [25.5 KB], `crypto_full.js` [101 KB]): unlocking Ep 6+ via `fqnovel.com` requires **full proprietary ByteDance binary signing** (`X-Argus` [551 Protobuf + Simon + AES + SM3] + `X-Ladon` [34-round] + `X-Gorgon` + `X-Khronos`, or v5 `X-Medusa` + `X-Helios` + gzip body), **plus** `spade_a` CENC key derivation and ByteVC2 (`bv2C`) codec avoidance.
>
> 3. **VM Test Environment (`VBOOK_SERVER`)**: Confirmed **unset** (`env | grep -i vbook` empty; no `servers.json`; `http://127.0.0.1:18080/` returns `curl: (7) Couldn't connect to server`).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Discovery / Home | Homepage Featured Sections (`hongguoduanju.com`) | Official ByteDance Fanqie/Hongguo video web portal SSR home feed containing 4 curated rows: `热播短剧` (`all`), `热播真人剧` (`human` — live-action short drama), `热播漫剧` (`comic` — comic/motion animation), `热播AI剧` (`ai` — AI animation). 9 items per section. | `GET https://hongguoduanju.com/` (no auth, browser `User-Agent`) | HTTP 200 HTML embedding `window._ROUTER_DATA.loaderData.page.homeSections[]` (`tab_type`, `tab_name`, `video_list[]` with `series_id`, `series_title`, `series_cover`, `episode_cnt`, `episode_right_text`, `series_status`, `pay_type`, `category_list[]`). | Non-200 or missing `_ROUTER_DATA` on network failure. | Live probe (`curl`, `2026-11-20T02:19:21Z`) |
| 2 | Discovery / Rankings | 4 Video Ranking Charts (`hongguoduanju.com`) | Paginated top-100 charts across all videos, live-action short dramas, comic-dramas (漫剧), and AI dramas (AI剧). 20 items/page × 5 pages = 100 items. | `GET https://hongguoduanju.com/rank/{slug}?page={1..5}` where `slug` ∈ `hot-drama`, `hot-real-drama`, `hot-comic-drama`, `hot-ai-drama`. | HTTP 200 HTML embedding `window._ROUTER_DATA.loaderData['rank_{slug}/page'].content` (`isSuccess`, `rankList[]` [20 items with `seriesId`, `rank`, `title`, `cover`, `href`, `playHref`, `rankType`], `pagination: {pageNum, totalPages: 5, nextUrl}`). | HTTP 404 for unknown slug; empty `rankList` past page 5. | Live probe (`curl`, `2026-11-20T02:21` & `02:37Z`) |
| 3 | Genre / Categories | Short Drama, Comic-Drama & AI-Drama Catalogs + Sub-genre Filters (`hongguoduanju.com`) | Paginated category listings for all 3 video types with sub-genre path filtering. 24 items/page × 34 pages = 800 items per category/sub-genre. | `GET https://hongguoduanju.com/category/{type}[/{topic_slug}]?page={1..34}` where `type` ∈ `real-drama` (24 topics), `comic-drama` (8 topics), `ai-drama` (8 topics). Query filter `?topic=...` is INVALID (404) — must use path segment `/{topic_slug}`. | HTTP 200 HTML embedding `window._ROUTER_DATA.loaderData['category_$']` (`categoryRoute`, `selectorList[0].items[]` [`selector_item_id`, `show_name`, `category_json_ids`], `recommendList[]` [24 items with `series_id`, `series_name`, `series_cover`, `series_intro`, `episode_cnt`, `accessible_episode_cnt`, `pay_type`], `pagination: {total: 800, pageNum, pageSize: 24, totalPages: 34}`). | HTTP 404 on invalid path/query filter (`?topic=fantasy` → 404). Note: `/category/comic` (`漫画`, 74 items) is **static manga**, NOT playable video (`fallback-play-info` returns HTTP 403). | Live probe (`curl`, `2026-11-20T02:21`–`02:38Z`) |
| 4 | Search | Direct JSON Video Search (`hongguoduanju.com`) | Full-text JSON search returning BOTH live-action short dramas (`genre: "203"`) and comic/AI animations (`genre: "205"`). Zero auth, zero signature, zero cookies. | `GET https://hongguoduanju.com/api/search/result?query={url_encoded_q}[&page={N}]` + Header `Referer: https://hongguoduanju.com/search`. (`page` omitted or `1` for page 1; `page=2` for page 2. `pageNum` param is ignored!). Max query length: **30 chars**. | HTTP 200 JSON: `{ searchList: [{ doc_type: 23, name, keyword, video_data: { series_id, series_title, series_cover, series_intro, episode_cnt, series_status, pay_type, episode_right_text, vid_list (preview 5 IDs), category_list[], celebrities[], genre ("203"|"205"), hot_score_data, favorite_text, like_text } }], totalCount (string), accessibleEpisodeCnt (5), pageNum (int), totalPages (int), hasMore (bool) }`. 10 items/page. | Empty query → HTTP 400 `{"code":"invalid_query","validation_reason":"empty"}`; >30 chars → HTTP 400 `{"code":"invalid_query","validation_reason":"too_long"}`; Rate-limit/WAF → HTTP 403 `search_verification_required` + `bdturing-verify` header (from official JS `3o.js`). Non-matching gibberish returns fuzzy recommendations (`totalCount: "196"`). | Official frontend JS (`3o.121662c154.js`) + Live probe (`curl`, `2026-11-20T02:33`–`02:40Z`) |
| 5 | Search (Auxiliary) | Search Autocomplete / Suggestions (`hongguoduanju.com`) | Direct JSON suggestion endpoint returning matching series titles + `video_data`. | `GET https://hongguoduanju.com/api/search/suggestion?query={q}` + `Referer: https://hongguoduanju.com/search`. | HTTP 200 JSON `{ suggestionList: [{ name, keyword, word_type: "short_play_name", display_words[], video_data }] }`. | HTTP 400 on empty query; may return `bdturing-verify` header if throttled. | Official frontend JS (`3o.121662c154.js`) + Live probe (`curl`, `2026-11-20T02:39:58Z`) |
| 6 | Detail | Series Metadata & Episode Manifest (`hongguoduanju.com`) | Full series detail SSR endpoint matching canonical `series_id` URLs (shared across Fanqie & Hongguo). | `GET https://hongguoduanju.com/detail?series_id={series_id}` (browser `User-Agent`). | HTTP 200 HTML embedding `window._ROUTER_DATA.loaderData.detail_page`: `seriesDetail` (`series_id`, `series_name`, `series_cover`, `series_intro`, `tags[]`, `episode_cnt`, `accessible_episode_cnt` [5], `pay_type` [0], `episode_right_text`, `celebrities[]`, `series_episode_info: {episode_cnt, episode_total_cnt, series_status}` [1=completed], `vid_list[]` [ALL episode IDs: 96/207/317], `first_visible_time`, `season_info`, `record_number`) + `seriesSocialInfo` (`rating`, `rank_label`, `hot_score_data`, `series_like_count`, `series_favorite_count`, `reviews`). | Invalid `series_id` (`9999999999999999999`) → **HTTP 500** HTML error shell (44,786 B, no valid `seriesDetail`). | Live probe (`curl`, `2026-11-20T02:21`–`02:39Z`) |
| 7 | TOC (Cross-Platform Fanqie API) | Fanqie Novel Web Directory API (`fanqienovel.com`) | Public, unsigned, unauthenticated JSON endpoint on `fanqienovel.com` that accepts **ALL** Hongguo/Fanqie video `series_id`s (`real-drama`, `comic-drama`, `ai-drama`) and returns every episode's `itemId`, exact Chinese title (`第1集`..`第N集`), `realChapterOrder`, `needPay`, and `isChapterLock`. | `GET https://fanqienovel.com/api/reader/directory/detail?bookId={series_id}` (no auth, no signature). | HTTP 200 JSON: `{ code: 0, message: "success", data: { allItemIds: string[], volumeNameList: string[], chapterListWithVolume: [[{ itemId, title, needPay (0), isChapterLock (bool: false for eps 1–10, true for 11+), isPaidPublication (false), isPaidStory (false), realChapterOrder, firstPassTime }]] } }`. Verified 96 eps (short drama), 207 eps (comic drama), 317 eps (AI drama). | Invalid `bookId` returns non-zero code or empty `chapterListWithVolume`. Note: `isChapterLock: false` covers 10 eps here, whereas web video playback (`hongguoduanju.com`) only unlocks `accessible_episode_cnt` (5 eps). | Live probe (`curl`, `2026-11-20T02:21` & `02:30Z`) |
| 8 | Playback / Chap & Track (Primary Unencrypted — Web Ep 1–5) | Protected Play-Info API (`hongguoduanju.com`) | Direct JSON playback resolver (zero auth/signature). Returns **either** `legacy_play_info` (**720p unencrypted muxed H.264+AAC MP4, `er=0`** — observed on Comic-Drama & AI-Drama!) **or** `play_info` (**360p/480p/720p CENC AES-CTR DASH, `er=1`, separate video + audio + `kid` + `player_access_key`** — observed on Live-Action Short Drama!). | `POST https://hongguoduanju.com/api/video/protected/play-info`, `Content-Type: application/json`, `Origin: https://hongguoduanju.com`, body: `{"series_id":"<id>","item_id":"<vid>","definition":"720p"}` (`definition` ∈ `"360p"`, `"480p"`, `"720p"` ONLY). | **Mode 1 (`legacy_play_info` — Comic/AI Drama)**: `{ legacy_play_info: { main_url (er=0 MP4), width ("1282"|"720"), height ("720"|"1282"), duration (115.868|96.944) }, base_resp: { StatusCode: 0 } }`. **Mode 2 (`play_info` — Live-Action Drama)**: `{ play_info: { vid, kid (32-char hex), main_url (video fMP4, er=1), backup_url, player_access_key (37B base64 spade_a), definition, format: "dash", codec_type: "h264", width, height, duration, size, bitrate, init_range, index_range, first_moof_range, expires_at, audio: { main_url, backup_url, player_access_key, kid, size, duration, init_range, index_range } }, base_resp: { StatusCode: 0 } }`. | Ep > `accessible_episode_cnt` (Ep 6, Ep 10) → **HTTP 403** `{"error":"protected_playback_unavailable"}`. Unsupported `definition` (`"540p"`, `"1080p"`) → **HTTP 400** `{"error":"protected_playback_unavailable"}`. | Official frontend JS (`f.13edd50086.js`) + Live probe (`curl`, `2026-11-20T02:33`–`02:39Z`) |
| 9 | Playback / Chap & Track (Universal Unencrypted — Web Ep 1–5) | Public Fallback Play-Info API (`hongguoduanju.com`) | Direct JSON fallback resolver (zero auth/signature) returning **100% UNENCRYPTED full-length muxed H.264+AAC MP4 (`er=0`)** for **BOTH** Live-Action Short Drama AND Comic-Drama/Animation (for Ep 1–5), bypassing DASH/CENC entirely. | `POST https://hongguoduanju.com/api/video/protected/fallback-play-info`, `Content-Type: application/json`, `Origin: https://hongguoduanju.com`, body: `{"item_id":"<vid>"}`. | HTTP 200 JSON: `{ main_url: "https://v*-hgweb.qznovelvod.com/...&er=0&...&mime_type=video_mp4...", url_expire: <unix_ts>, base_resp: { StatusCode: 0, StatusMessage: "" } }`. Verified full duration (`178.966s` / `17.52 MB` short drama; `115.868s` / `10.80 MB` comic drama). | Ep > `accessible_episode_cnt` (Ep 6, Ep 10) or `/category/comic` static manga → **HTTP 403** `{"error":"public_fallback_unavailable"}`. | Official frontend JS (`08q.724d57728b.js`) + Live probe (`curl`, `2026-11-20T02:33`–`02:39Z`) |
| 10 | Media Stream Delivery | ByteDance VOD CDN (`v3/v11/v26-hgweb.qznovelvod.com`) | Direct HTTP/2 Range-capable MP4/fMP4 media delivery for `legacy_play_info`, `fallback-play-info`, and `play_info` URLs. | `GET <main_url>` with `Range: bytes=0-...`, browser `User-Agent`, and **either NO `Referer` OR `Referer: https://hongguoduanju.com/`**. | HTTP 200/206, `content-type: video/mp4`, valid `content-range`, real MP4 `ftyp`/`moov`/`mvhd`/`avc1`/`mp4a` bytes (unencrypted for `er=0`; ISO CENC `encv`/`sinf`/`schm:cenc`/`tenc` for `er=1`). URLs expire (~1 hour via `url_expire`/`expires_at`). | **Any third-party `Referer`** (tested `https://example.com/`) → **HTTP/2 403 Forbidden** (304 B). Expired signature → HTTP 403. | Live Range probes (`curl`, `2026-11-20T02:34`–`02:38Z`) |
| 11 | Playback (TRAP / Preview Only) | SEO Public 10s Preview MP4 (`hongguoduanju.com`) | `<script type="application/ld+json">` `VideoObject.contentUrl` on `/player/{series_id}/{vid}` returns `/video/public/{vid}/360p.mp4`. **ONLY a 10.000s 360p preview clip**, NOT a full episode! | `GET https://hongguoduanju.com/video/public/{vid}/360p.mp4` | HTTP 206, `video/mp4`, `1,272,953` B, `mvhd timescale=1000 dur=10000` = **10.000s** (despite `VideoObject.duration: "PT2M58S"`). | Ep 10 → **HTTP 404** (0 B). `/player/{series_id}/{ep10_vid}` → **HTTP 302** redirect. | Live probe + MP4 `mvhd` parse (`2026-11-20T02:24`–`02:25Z`) |
| 12 | Mobile App Identity | ByteDance Anonymous Device Registration (`log.snssdk.com`) | Registers an anonymous Android guest device returning real `device_id` and `install_id` for both Fanqie Novel (`aid=1967`) and Hongguo (`aid=8662`). Plain JSON works when `tt_data=a` is omitted! | `POST https://log.snssdk.com/service/2/device_register/?aid={1967|8662}&app_name={novelapp|phoenix_read}&version_code=73532&version_name=7.3.5.32&channel=update_64&device_platform=android&os_api=35&os_version=15&ac=wifi&device_type=25053RT47C&device_brand=Redmi` (NO `tt_data=a`!), plain JSON body `{ magic_tag: "ss_app_log", _gen_time, header: {...} }`. | HTTP 200 JSON (355 B): `{ server_time, device_id, install_id, device_id_str, install_id_str, new_user: 1, klink_egdi: "<REDACTED>", device_token: "<REDACTED>" }`. | Passing `tt_data=a` with plain JSON returns HTTP 200 `{"device_id":0,"install_id":0}` (expects TTEncrypt V5 binary body). | Live probe (`curl`, `2026-11-20T02:26`–`02:27Z`) |
| 13 | Mobile App API (GATED — Signing Required) | ByteDance FQNovel App APIs (`api5-normal-sinfonline{a,b,c}.fqnovel.com`, `api5-normal-lf.fqnovel.com`, `reading.snssdk.com`, `novel.snssdk.com`) | Official mobile app backend hosting full episode catalog (Ep 1–N, `pay_type: 0`): `/reading/distribution/category/landpage/v/`, `/reading/bookapi/bookmall/cell/change/v`, `/reading/bookapi/bookmall/tab/v`, `/reading/bookapi/search/tab/v`, `/reading/bookapi/multi-detail/v/`, `/novel/player/multi_video_detail/v1/`, `/novel/player/video_model/v1/`, `/novel/player/multi_video_model/v1/`. | Requires registered `device_id`/`install_id` + full ByteDance AGW cryptographic signatures (`X-Argus` [551 Protobuf + Simon + AES + SM3] + `X-Ladon` [34-round] + `X-Gorgon` + `X-Khronos` + `X-SS-STUB`, or v5 `X-Medusa` + `X-Helios` + gzip body). | When properly signed (per Nov 2026 upstream docs): JSON with `video_model` containing 360p–1080p CENC tracks (`spade_a`, `main_url`; note 360p–720p frequently use ByteVC2 `bv2C` codec, 1080p uses HEVC `bytevc1`). | **Verified Live**: Unsigned requests (with or without registered `device_id`/`install_id`), AND `X-Gorgon`+`X-Khronos`-only requests, ALL silently return **`HTTP/2 200`, `Content-Length: 0`**, `x-agw-info: ...`, `server-timing: ... tt_agw`. | Live probes across all 6 hosts (`2026-11-20T02:22`–`02:40Z`) + `aston314/hongguo-tv` Nov 2026 protocol docs |
| 14 | Novel-Only Endpoints (Out of Video Scope) | Fanqie Novel Web & SDK Endpoints (`fanqienovel.com`, `api.fanqiesdk.com`) | `fanqienovel.com/` (novel HTML), `fanqienovel.com/page/<series_id>` (404 for video IDs), `fanqienovel.com/api/author/library/book_list/v0/` (PUA-encrypted novels), `fanqienovel.com/api/reader/full` (Turing blocked 0 B), `api.fanqiesdk.com/api/novel/channel/homepage/search/search/v1` (returns novels `genre=0/8` only, even with `tab_type=11` or drama title). | Standard GET requests | Text novel metadata only (zero video streams or drama items). | `fanqienovel.com/page/<video_series_id>` → **HTTP 404**; `api.fanqiesdk.com` `video_model` / `multi-detail` / `directory/list` → **HTTP 200, 0 B**; `landpage` → **HTTP 404**. | Live probes (`curl`, `2026-11-20T02:19`–`02:30Z`) |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | `hongguoduanju.com` Web Playback Boundary (`accessible_episode_cnt`) | Ep 1 (`7706514645208534041`) & Ep 5 (`7706514702792133657`) vs Ep 6 (`7706514796681628697`) & Ep 10 (`7706514675734678553`) of `7706512650816982040` (`accessible_episode_cnt: 5`, `episode_cnt: 96`) | **Ep 1 & Ep 5**: `fallback-play-info` returns `HTTP 200` with full unencrypted MP4 (`178.966s`). **Ep 6 & Ep 10**: `fallback-play-info` returns `HTTP 403 {"error":"public_fallback_unavailable"}`; `play-info` returns `HTTP 403 {"error":"protected_playback_unavailable"}`; `/player/.../Ep10` returns `HTTP 302`; `/video/public/Ep10/360p.mp4` returns `HTTP 404`. |
| 2 | `play-info` Dual Response Format (`legacy_play_info` vs `play_info`) | `POST /api/video/protected/play-info` with `definition: "720p"` on Live-Action Drama (`7706512650816982040`) vs Comic-Drama (`7708355462780947518`) & AI-Drama (`7705824595416190014`) | **Live-Action**: returns `play_info` (CENC encrypted DASH `er=1`, separate video+audio, `kid`+`player_access_key`). **Comic-Drama & AI-Drama**: returns `legacy_play_info` (720p **unencrypted** muxed MP4 `er=0`, `1282×720` / `720×1282`, directly playable!). |
| 3 | `play-info` Definition Enum Validation | `definition` = `"360p"`, `"480p"`, `"540p"`, `"720p"`, `"1080p"` | `"360p"` (`360×640`, 12.8 MB), `"480p"` (`480×854`, 19.9 MB), `"720p"` (`720×1280`, 31.8 MB) → **HTTP 200**. `"540p"` and `"1080p"` → **HTTP 400** `{"error":"protected_playback_unavailable"}`. |
| 4 | VOD CDN Referer Anti-Hotlink (`qznovelvod.com`) | `GET <main_url>` with (a) no `Referer`, (b) `Referer: https://hongguoduanju.com/`, (c) `Referer: https://example.com/` | (a) No Referer → **HTTP 206** (`video/mp4`). (b) `Referer: https://hongguoduanju.com/` → **HTTP 206** (`video/mp4`). (c) Third-party Referer → **HTTP 403** (304 B). |
| 5 | SEO Public MP4 Preview Clip Trap | `GET https://hongguoduanju.com/video/public/7706514645208534041/360p.mp4` (`Range: bytes=0-1023`) | Returns `HTTP 206`, `1,272,953` B, `video/mp4`, but MP4 `mvhd` box has `timescale=1000, dur=10000` = **exact 10.000s clip** (NOT the 178.966s full episode). |
| 6 | `/category/comic` Non-Video Content | `/category/comic` (`漫画`, 74 items), tested item `7111943588446997534` (`天神殿`, `vid0=7112314060259262990`) | Detail SSR loads (`accessible_episode_cnt: 5`), but `fallback-play-info` returns **HTTP 403** `{"error":"public_fallback_unavailable"}`. Exclude `/category/comic` from a `video` extension; use `real-drama`, `comic-drama`, and `ai-drama`. |
| 7 | Category Filter URL Syntax | `/category/comic-drama?topic=fantasy&page=1` vs `/category/comic-drama/fantasy` | Query parameter `?topic=fantasy` → **HTTP 404**! Path segment `/category/comic-drama/fantasy` → **HTTP 200** (24 items, `total: 800`, `totalPages: 34`). |
| 8 | Search Query Validation & Pagination Param | `GET /api/search/result` with (a) `query=` empty, (b) 31-char query, (c) `pageNum=2` vs `page=2`, (d) gibberish `zzzzxxxx99999qqq` | (a) Empty → **HTTP 400** `validation_reason: "empty"`. (b) 31 chars → **HTTP 400** `validation_reason: "too_long"` (limit is 30 chars). (c) `pageNum=2` ignored (returns page 1); **`page=2`** works (returns `pageNum: 2`, distinct 10 items). (d) Gibberish returns HTTP 200 with 196 fuzzy fallback items (not empty array). |
| 9 | Invalid `series_id` on Detail Page | `GET https://hongguoduanju.com/detail?series_id=9999999999999999999` | Returns **HTTP 500** HTML (44,786 B) without valid `seriesDetail`. |
| 10 | `fanqienovel.com` Directory `isChapterLock` vs Web `accessible_episode_cnt` | `GET https://fanqienovel.com/api/reader/directory/detail?bookId=7706512650816982040` (and `7708355462780947518`, `7705824595416190014`) | All 3 video series report `needPay: 0`, `isChapterLock: false` for **Episodes 1–10**, and `isChapterLock: true` for **Episodes 11–N** — differing from `hongguoduanju.com`'s web playback limit (`accessible_episode_cnt: 5`). |
| 11 | `device_register` `tt_data=a` Parameter Behavior | `POST https://log.snssdk.com/service/2/device_register/` with vs without `&tt_data=a` (plain JSON body) | With `tt_data=a` → HTTP 200 `{"device_id":0,"install_id":0}`. **Without `tt_data=a`** → HTTP 200 with real non-zero `device_id_str` & `install_id_str` for both `aid=1967` and `aid=8662`. |
| 12 | Large MP4 `moov` Box Size | `fallback-play-info` short drama MP4 (`17.52 MB`, `178.966s`) | `ftyp` (32 B) + `moov` (**150,247 B**). Standard progressive MP4 (`faststart`, `moov` before `mdat`) — optimal for instant native ExoPlayer streaming/seeking. |

---

## 1. Observation

### 1.1 Local Workspace & Prior Research Verification
1. **`/home/antigravity/qsang2025/Qsang_vbook/extensions/`**:
   - `find /home/antigravity/qsang2025/Qsang_vbook/extensions -maxdepth 2 -iname '*fanqie*' -o -iname '*fq*' -o -iname '*cachua*'` → **0 results**.
   - `extensions/video/` contains only `hhtqvietsub`, `hoathinh3d`, `hoathinh_ai` (and `README.md`, `.gitkeep`).
2. **`/home/antigravity/qsang2025/muse-teamwork/research/108-fanqie-fork-extensions.md`** & **`109-fanqie-pua-verify.md`**:
   - Confirmed all prior Fanqie fork extensions except `duongden/vbook`'s encrypted `FQ Video` v3 are text novels; `fanqienovel.com/api/reader/directory/detail` was already noted as public HTTP 200, while `fanqienovel.com/api/reader/full` returns Turing-blocked HTTP 200 / 0 B.
3. **`/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/explorer_fqvideo_forks_1/handoff.md`**:
   - Confirmed `duongden/vbook`'s `FQ Video` v3 (GPL-3.0, `"encrypt": true`) uses `regexp` matching `fanqienovel|fqnovel|snssdk|changdunovel`, `VIDEO_QUALITY` (`360`/`480`/`540`/`720`, default `360` with `"thấp hơn sẽ giảm bộ nhớ"`), `thread_num: 1`, and contains 167 KB of encrypted protocol/DRM modules (`video_sign.js` [21 KB], `video_dash.js` [19.8 KB], `video_cenc.js` [25.5 KB], `crypto_full.js` [101 KB]).
4. **`/home/antigravity/qsang2025/Qsang_vbook/extension-api.md`**:
   - Lines 183–237 & 933–1172: Video extensions require `search`, `detail`, `toc`, `chap`, `track` (optional `home`, `genre`, `page`, `config`). `detail.js` supports `type: "video"`, `format: "series" | "stream" | "short"` (`short` enables vertical short-video swipe feed; `series` uses standard player).
   - Line 969: `track.js` supports `audios: [{ data, type, label, language, headers }]`.
   - Line 1006: `track.js` supports `drm: { scheme: "clearkey", keys }` (`kid:key` hex pairs or EME JWK JSON).
   - Lines 1112–1127: `native` resolver accepts absolute `http(s)` media URL (`.mp4`, `.m3u8`, etc.), HLS `data:` URI, or raw `#EXTM3U`; rejects DASH/MP4 `data:` URIs.
   - Lines 1611–1663: Built-in `load('crypto.js')` provides `CryptoJS` (`MD5`, `SHA1`, `SHA256`, `SHA512`, `AES` CBC/ECB/CTR/GCM, `Base64`, `Hex`).

### 1.2 VM Device Test Environment (`VBOOK_SERVER`) Check
Executed `2026-11-20T02:16:57Z`:
```text
=== ENV ===
PWD=/home/antigravity/qsang2025/Qsang_vbook
=== SERVERS.JSON ===
(none found under /home/antigravity/qsang2025/Qsang_vbook or /home/antigravity/.agents)
=== 127.0.0.1:18080 ===
curl: (7) Failed to connect to 127.0.0.1 port 18080 after 0 ms: Couldn't connect to server
```
Confirmed: no `VBOOK_SERVER` is configured or reachable from this cloud VM in the current run.

### 1.3 Sanitized Live Probe Transcripts (All Strictly Paced ≥2–3s/Host, Zero 405/429 Triggers)

#### A. `fanqienovel.com` & `api.fanqiesdk.com`
- `GET https://fanqienovel.com/` → `HTTP/2 200`, `145,838 B`, `<title>小说,番茄小说网_好看的小说尽在番茄小说官网</title>`. `__INITIAL_STATE__` has only novel sections (`home`, `search`, `rank`, `reader`, etc.); zero short-drama or animation video listings.
- `GET https://fanqienovel.com/page/7706512650816982040` → `HTTP/2 404` (`33,044 B`).
- `GET https://fanqienovel.com/api/reader/directory/detail?bookId=7706512650816982040` (Short Drama) → `HTTP/2 200`, `21,570 B`, `code: 0`, 96 episodes (`needPay: 0`, `isChapterLock: false` for eps 1–10, `true` for eps 11–96).
- `GET https://fanqienovel.com/api/reader/directory/detail?bookId=7708355462780947518` (Comic-Drama) → `HTTP/2 200`, `46,539 B`, `code: 0`, 207 episodes (`needPay: 0`, `isChapterLock: false` for eps 1–10, `true` for 197 eps).
- `GET https://fanqienovel.com/api/reader/directory/detail?bookId=7705824595416190014` (AI-Drama) → `HTTP/2 200`, `71,291 B`, `code: 0`, 317 episodes (`needPay: 0`, `isChapterLock: false` for eps 1–10, `true` for 307 eps).
- `GET https://fanqienovel.com/api/reader/full?itemId=7706514645208534041` → `HTTP/2 200`, `0 B`.
- `GET https://api.fanqiesdk.com/api/novel/channel/homepage/search/search/v1?device_platform=android&offset=0&aid=1967&q=少夫人来自东北3` (and `tab_type=11&q=求生`) → `HTTP/2 200`, `8,558 B` / `12,463 B`, `code: 0`, returns **only text novels (`genre: "0"` / `"8"`)**.
- `api.fanqiesdk.com` `/reading/bookapi/multi-detail/v/`, `/api/novel/book/directory/list/v1`, `/novel/player/video_model/v1/` → `HTTP/2 200`, `0 B`; `/reading/distribution/category/landpage/v/` → `HTTP 404`.

#### B. `log.snssdk.com` & ByteDance Mobile App APIs (`fqnovel.com` / `snssdk.com`)
- `POST https://log.snssdk.com/service/2/device_register/?aid=1967&...` (plain JSON, **no** `tt_data=a`):
  ```json
  {"server_time":1795141621,"device_id":129123812647769,"install_id":129123812651865,"klink_egdi":"<REDACTED>","new_user":1,"device_id_str":"129123812647769","install_id_str":"129123812651865","device_token":"<REDACTED>"}
  ```
- Same for `aid=8662` (`app_name=phoenix_read`): `HTTP 200`, `355 B`, valid non-zero `device_id_str` & `install_id_str`.
- Live probes against `api5-normal-sinfonlineb.fqnovel.com` (+ `sinfonlinea`, `sinfonlinec`, `api5-normal-lf.fqnovel.com`, `reading.snssdk.com`, `novel.snssdk.com`):
  - Endpoints tested: `/novel/player/video_model/v1/`, `/novel/player/multi_video_model/v1/`, `/novel/player/multi_video_detail/v1/`, `/reading/distribution/category/landpage/v/`, `/reading/bookapi/multi-detail/v/`, `/reading/bookapi/search/tab/v`, `/api/novel/book/directory/list/v1`.
  - Modes tested: (1) unsigned random IDs, (2) unsigned with live registered `device_id`/`install_id` (`aid=1967` & `aid=8662`), (3) `X-Gorgon` + `X-Khronos` + `X-SS-STUB` alone.
  - **100% of requests returned**:
    ```text
    HTTP/2 200
    content-type: application/json
    server: volc-dcdn
    server-timing: inner; dur=19, ..., tt_agw; dur=11
    x-agw-info: <REDACTED>
    content-length: 0
    ```
  - No 403/405/429 IP block; AGW (`tt_agw`) silently dropped requests lacking full ByteDance cryptographic signatures (`X-Argus` + `X-Ladon` / `X-Medusa` + `X-Helios`).

#### C. `hongguoduanju.com` (Official ByteDance Fanqie/Hongguo Web Portal — Assets under `lf-fe.fqnovelstatic.com/obj/novel-fanqie-fe/`)
- **Home**: `GET https://hongguoduanju.com/` → `HTTP/2 200` (`177,640 B`, `Set-Cookie: ttwid=<REDACTED>` — cookie NOT required for subsequent requests). `_ROUTER_DATA.loaderData.page.homeSections`:
  - `all` (`热播短剧`, 9 items), `human` (`热播真人剧`, 9 items), `comic` (`热播漫剧`, 9 items), `ai` (`热播AI剧`, 9 items).
- **Rankings**: All 4 charts (`hot-drama`, `hot-real-drama`, `hot-comic-drama`, `hot-ai-drama`) → `HTTP/2 200` (`232–233 KB`), `20 items/page`, `pagination: {pageNum: 1, totalPages: 5}`.
- **Categories** (exact verified slugs & `category_json_ids`):
  - `/category/real-drama` (`真人剧`, `rpcContentType` live-action, `total: 800`, `24/page`, `34 pages`) — 24 sub-genres: `romance` (爱情/5000), `period` (年代/5021), `comeback` (逆袭/5031), `legend` (传奇/5011), `growth` (成长/5010), `family` (家庭/5001), `clan` (家族/5002), `cute-kids` (萌宝/5003), `suspense` (悬疑/5004), `thriller` (惊悚/5132), `horror` (恐怖/5133), `supernatural` (志怪/5006), `costume` (古装/5007), `fantasy` (玄幻/5008), `wonder` (奇幻/5009), `urban` (都市/5022), `youth` (青春/5023), `comedy` (喜剧/5024), `sci-fi` (科幻/5025), `disaster` (灾难/5026), `action-adventure` (动作冒险/5027), `war` (战争/5028), `variety` (综艺/5029), `drama` (剧情/5030).
  - `/category/comic-drama` (`漫剧`, `rpcContentType: 3`, `total: 800`, `24/page`, `34 pages`; verified `?page=2` & `/category/comic-drama/fantasy`) — 8 sub-genres: `creative` (脑洞/755), `fantasy` (玄幻/7), `drama` (剧情/316), `apocalypse` (末世/68), `wealthy-family` (豪门/936), `wonder` (奇幻/6), `sci-fi` (科幻/1092), `adventure` (冒险/1182).
  - `/category/ai-drama` (`AI剧`, `total: 800`, `24/page`, `34 pages`) — same 8 sub-genres.
  - `/category/comic` (`漫画`, `total: 74`) — static comics only (`fallback-play-info` returns `HTTP 403`).
- **Search**:
  - `GET https://hongguoduanju.com/api/search/result?query=%E4%B8%9C%E5%8C%97` → `HTTP/2 200` (`18,382 B`), `totalCount: "208"`, `pageNum: 1`, `totalPages: 21`, `hasMore: true`, 10 items (incl. `7706512650816982040` `少夫人来自东北3`, `genre: "203"`).
  - `GET https://hongguoduanju.com/api/search/result?query=%E4%B8%9C%E5%8C%97&page=2` → `HTTP/2 200` (`13,520 B`), `pageNum: 2`, 10 distinct items (`7704170173787278398`, `7685727255871360024`, etc.).
  - `GET https://hongguoduanju.com/api/search/result?query=%E6%B1%82%E7%94%9F` → `HTTP/2 200` (`16,295 B`), `totalCount: "206"`, returns comic/AI animations (`genre: "205"`, e.g. `7708446852923804734` `全民求生！我觉醒了唯一序列幸运`, `7691938290202577944` `公路求生榜一说她要走到公路尽头`).
- **Detail**:
  - `GET https://hongguoduanju.com/detail?series_id=7706512650816982040` → `HTTP/2 200` (`579,085 B`), `seriesDetail` contains full metadata + `accessible_episode_cnt: 5` + all 96 IDs in `vid_list[]`.
- **Playback APIs & Live Range Media Verification**:
  - `POST /api/video/protected/fallback-play-info` (`{"item_id":"7706514645208534041"}`, Short Drama Ep 1): `HTTP/2 200`, `er=0` MP4 URL.
    - Range `0-65535` (no Referer): `HTTP/2 206`, `content-type: video/mp4`, `content-range: bytes 0-65535/17520901`, `boxes=['ftyp','moov','mvhd','avc1']` (`moov` size `150,247 B`), **`mvhd dur=178966/1000 = 178.966s`** (FULL episode!).
    - Range `0-1023` (`Referer: https://hongguoduanju.com/`): `HTTP/2 206` ✅.
    - Range `0-1023` (`Referer: https://example.com/`): **`HTTP/2 403`** ❌ (304 B).
  - `POST /api/video/protected/fallback-play-info` (`{"item_id":"7708355470964050969"}`, Comic-Drama Ep 1): `HTTP/2 200`, `er=0` MP4 URL.
    - Range `0-65535` (no Referer): `HTTP/2 206`, `content-type: video/mp4`, `content-range: bytes 0-65535/10801690`, `boxes=['ftyp','moov','mvhd','avc1','mp4a']`, **`mvhd dur=115868/1000 = 115.868s`** (FULL unencrypted H.264+AAC episode!).
  - `POST /api/video/protected/play-info` (`{"series_id":"7708355462780947518","item_id":"7708355470964050969","definition":"720p"}`, Comic-Drama Ep 1): `HTTP/2 200`, returns `legacy_play_info` (`1282×720`, `115.868s`, `er=0` MP4).
    - Range `0-65535` (`Referer: https://hongguoduanju.com/`): `HTTP/2 206`, `content-type: video/mp4`, `content-range: bytes 0-65535/21086919` (`21.08 MB`), `boxes=['ftyp','moov','mvhd','avc1','mp4a']`, **`duration=115.868s`** (FULL unencrypted 720p episode!).
  - `POST /api/video/protected/play-info` (`{"series_id":"7705824595416190014","item_id":"7705826165692304409","definition":"720p"}`, AI-Drama Ep 1): `HTTP/2 200`, returns `legacy_play_info` (`720×1282`, `96.944s`, `er=0` MP4).
  - `POST /api/video/protected/play-info` (`{"series_id":"7706512650816982040","item_id":"7706514645208534041","definition":"720p"}`, Live-Action Short Drama Ep 1): `HTTP/2 200`, returns `play_info` (`720×1280`, `31.8 MB`, `er=1`, `format: "dash"`, `codec_type: "h264"`, `kid: "6af284c3476d5a621c173a700003ebeb"`, `player_access_key` [37 B decoded], `audio.main_url` [3.0 MB]).
    - Range `0-1740` (no Referer): `HTTP/2 206`, `content-type: video/mp4`, `content-range: bytes 0-1740/31826752`, `boxes=['ftyp','moov','mvhd','avc1','encv','sinf','schm','cenc','tenc','sidx']`, `duration=178.960s`, **`tenc KID=6af284c3476d5a621c173a700003ebeb`** (exact match to JSON `kid`).
  - **Ep 5 vs Ep 6 Boundary**:
    - Ep 5 (`7706514702792133657`): `fallback-play-info` → `HTTP/2 200` (`584 B`, full MP4 URL).
    - Ep 6 (`7706514796681628697`): `fallback-play-info` → **`HTTP/2 403` `{"error":"public_fallback_unavailable"}`**.
    - Ep 10 (`7706514675734678553`): `play-info` → **`HTTP/2 403` `{"error":"protected_playback_unavailable"}`**; `fallback-play-info` → **`HTTP/2 403` `{"error":"public_fallback_unavailable"}`**.

---

## 2. Logic Chain

1. **Fanqie Novel's web domain (`fanqienovel.com`) has NO video catalog or video stream API, ONLY cross-compatible TOC metadata** (Obs 1.3.A):
   - `fanqienovel.com/` only serves novels; `fanqienovel.com/page/<video_series_id>` returns 404; `api.fanqiesdk.com` search returns novels only (`genre=0/8`).
   - Only `fanqienovel.com/api/reader/directory/detail?bookId=<series_id>` works on video series IDs (proving Fanqie Novel and Hongguo Short Drama share the exact same underlying ByteDance `book_id`/`series_id` and `item_id`/`vid` namespace).
2. **ByteDance's official public web portal for this shared catalog (`https://hongguoduanju.com`) provides a 100% unsigned, Rhino-ES6-compatible direct API for the entire discovery/search/detail/TOC lifecycle AND full-length unencrypted native MP4 playback for Episodes 1–5** (Obs 1.3.C):
   - Every lifecycle stage (`home`, `genre`, `search`, `detail`, `toc`, `chap`, `track`) works using plain vBook `fetch()` with zero cookies, zero login, zero proprietary signing, and zero JS decryption:
     - `play-info` (`definition: "720p"`) gives 720p unencrypted MP4 (`legacy_play_info.main_url`) for Comic-Drama & AI-Drama.
     - `fallback-play-info` gives unencrypted full-length muxed H.264+AAC MP4 (`er=0`) for Live-Action Short Drama AND Comic-Drama/Animation.
     - `qznovelvod.com` serves HTTP 206 `video/mp4` natively when `headers: { "Referer": "https://hongguoduanju.com/" }` is returned from `track.js`.
3. **CRITICAL LIMITATION — Public web playback is hard-capped at `accessible_episode_cnt` (first 5 episodes per series), whereas unlocking Ep 6..N requires the Mobile App API (`fqnovel.com`) which enforces proprietary ByteDance cryptographic signing + CENC DRM** (Obs 1.3.B, 1.3.C, 1.1.3):
   - Ep 5 succeeds (`HTTP 200`), while Ep 6 and Ep 10 return `HTTP 403` (`public_fallback_unavailable` / `protected_playback_unavailable`). Across all 72 catalog items sampled across `real-drama`, `comic-drama`, and `ai-drama`, `full_free_on_web = 0` (every series has `episode_cnt` 41–1000, `accessible_episode_cnt` 3 on list / 5 on detail).
   - Meanwhile, on `api5-normal-sinfonline{a,b,c}.fqnovel.com` / `api5-normal-lf.fqnovel.com` / `reading.snssdk.com` / `novel.snssdk.com`, even after completing live plain-JSON `device_register` (`log.snssdk.com`, HTTP 200), every tested endpoint returns `HTTP 200 / Content-Length: 0` with `x-agw-info` unless signed with ByteDance's proprietary `X-Argus` (551 Protobuf + Simon + AES + SM3) + `X-Ladon` (34-round) + `X-Gorgon` + `X-Khronos` (or v5 `X-Medusa` + `X-Helios`).
   - This independently explains why `duongden/vbook`'s reference `FQ Video` v3 zip (`explorer_fqvideo_forks_1`) bundles 167 KB of encrypted protocol/crypto modules (`video_sign.js`, `video_dash.js`, `video_cenc.js`, `crypto_full.js`) and warns `"Chất lượng phim (thấp hơn sẽ giảm bộ nhớ)"`.
4. **ClearKey (`extension-api.md:1006`) Assessment**:
   - On `hongguoduanju.com` `play-info` (720p live-action DASH), the stream uses standard ISO CENC (`schm: cenc`) with a `tenc` `KID` exactly matching JSON `play_info.kid` (`6af284c3476d5a621c173a700003ebeb`), plus separate `audio.main_url` and 37-byte base64 `player_access_key` (`spade_a`).
   - In theory, vBook `track.js` supports `drm: { scheme: "clearkey", keys: "<kid>:<key>" }` + `audios: [{ data: audioUrl }]` (avoiding in-memory JS decryption and OOM!).
   - **However**, two hard realities apply: (a) for web Ep 1–5, `fallback-play-info` and `legacy_play_info` **already provide unencrypted muxed MP4 (`er=0`)** so ClearKey is unnecessary for Ep 1–5; and (b) ClearKey alone does **NOT** unlock Ep 6+, because Ep 6+ requires proprietary ByteDance mobile app request signing (`X-Argus`/`X-Ladon`/`X-Medusa`/`X-Helios`) + `spade_a` key derivation + ByteVC2 codec avoidance, and ClearKey playback of `spade_a` streams cannot be runtime-tested without a live Android vBook `VBOOK_SERVER`.
5. **House Rules & Architectural Tradeoff (`AGENTS.md`)**:
   - **Option 1 (Clean Public Web API — `hongguoduanju.com` + `fanqienovel.com` TOC)**: 100% compliant with `AGENTS.md` (MIT clean-room, zero proprietary signing/DRM reverse-engineering, zero `encrypt: true`, zero third-party proxy, 100% Rhino ES6 `fetch()`, verified live unencrypted `type: "native"` MP4 streams for short drama + comic-drama + AI-drama, clear Vietnamese `Response.error(...)` for Ep 6+ locked episodes). **Tradeoff**: Only Episodes 1–5 per series are playable (matching official web guest access); Ep 6+ are explicitly marked `lock: true` in `toc.js` and return a clear Vietnamese message ("Tập này chỉ xem miễn phí trên ứng dụng Fanqie / Hồng Quả; web công khai chỉ mở 5 tập đầu") in `chap.js`/`track.js`.
   - **Option 2 (Full-Episode Mobile App Protocol — `fqnovel.com` + `device_register` + `X-Argus`/`X-Ladon`/`X-Medusa`/`X-Helios` + `spade_a` ClearKey/CENC)**: Required to play Ep 6–N without root/proxy, **but** carries severe blockers: (i) requires clean-room reimplementation of ByteDance's proprietary obfuscated native security SDK (`X-Argus` 551 Protobuf/Simon/AES/SM3, `X-Ladon`, or `X-Medusa`/`X-Helios`) in Rhino ES6 without copying GPL/AGPL/unlicensed repos, (ii) requires `spade_a` proprietary key unwrapping (DRM circumvention policy risk under house rules), (iii) fragile to frequent ByteDance AGW rotations (documented breaking twice in Oct–Nov 2026 alone), and (iv) cannot be end-to-end verified on Android ExoPlayer from this VM because `VBOOK_SERVER` is unavailable.

---

## 3. Caveats

1. **No Android `VBOOK_SERVER` / ExoPlayer runtime test from this VM**: All stream checks verified HTTP 206, `Content-Type: video/mp4`, exact MP4 container boxes (`ftyp`/`moov`/`mvhd`/`avc1`/`mp4a`/`encv`/`tenc`), durations, and Referer behavior via `curl`, not inside an actual Android vBook ExoPlayer instance.
2. **ClearKey (`drm: { scheme: "clearkey", keys }`) on `play-info` 720p DASH + separate `audios` was NOT runtime-verified in ExoPlayer**: Because `VBOOK_SERVER` is unreachable, we confirmed the wire format (`schm: cenc`, `tenc` KID matches JSON `kid`), and confirmed unencrypted `fallback-play-info` / `legacy_play_info` (`er=0`) exist as a DRM-free alternative, without implementing proprietary `spade_a` key unwrapping.
3. **Geo-IP factor (`136.121.28.7` → `oversea-US-LAX7`)**: All `hongguoduanju.com`, `fanqienovel.com/api/reader/directory/detail`, `log.snssdk.com`, and `qznovelvod.com` probes succeeded cleanly with HTTP 200/206 from this US cloud VM IP. While `fqnovel.com` returned `HTTP 200 / 0 B` due to AGW signature enforcement (matching reports from Mainland China users in `hongguo-desktop-releases#742` and `aston314/hongguo-tv`), we did not test from a Mainland China IP.
4. **Search Captcha (`bdturing-verify`)**: Under our paced testing (≥3s delay), `GET /api/search/result` never triggered captcha (`HTTP 200` on all 5 queries). Official frontend JS (`3o.121662c154.js`) shows ByteDance can return `HTTP 403` with `search_verification_required` + `bdturing-verify` header under burst traffic; strict pacing (`rate-limit.js`, `thread_num: 1`) is mandatory.
5. **Expiring Stream URLs**: `qznovelvod.com` signed stream URLs carry `url_expire` / `expires_at` (~1 hour TTL). `chap.js` should pass opaque `{ seriesId, itemId }` to `track.js`, and `track.js` should call `play-info` / `fallback-play-info` on demand right when the user starts playback.
6. **`fb1_noref` audio box offset**: Our 65,536-byte Range probe of `fallback-play-info` short drama (`17.52 MB`) captured `ftyp` + first 65 KB of its `150,247 B` `moov` box (confirming `avc1`, `mvhd 178.966s`, no `encv`); `mp4a` audio presence in the same endpoint family was directly confirmed in `fb_comic_noref` and `st_c720` (`boxes=['ftyp','moov','mvhd','avc1','mp4a']`).

---

## 4. Conclusion

### Go/No-Go Technical Recommendation for Project Orchestrator

1. **Direct, 100% Rhino-ES6-compatible, unencrypted `type: "native"` video APIs EXIST and are VERIFIED LIVE** via ByteDance's official Fanqie/Hongguo web portal (`https://hongguoduanju.com`, cross-compatible with `https://fanqienovel.com/api/reader/directory/detail`) — **covering BOTH short dramas (`real-drama`) AND animations (`comic-drama` 漫剧 + `ai-drama` AI剧)** with zero signing, zero login, zero cookies, and zero third-party proxies.
2. **HOWEVER — MANDATORY SCOPE DECISION BEFORE IMPLEMENTATION**:
   - **Under clean-room public web APIs (Option 1 — compliant with all `AGENTS.md` rules)**: Every lifecycle script (`home`, `genre`, `search`, `detail`, `toc`, `chap`, `track`) works cleanly and plays **full-length unencrypted native `.mp4` streams** (`720p` for Comic/AI Drama via `play-info.legacy_play_info`, and muxed H.264+AAC MP4 for Live-Action Short Drama & fallback via `fallback-play-info`, with `headers: { "Referer": "https://hongguoduanju.com/" }`), **BUT ByteDance hard-gates Episodes 6+ with HTTP 403 on public web** (`accessible_episode_cnt: 5`). Locked episodes (Ep 6+) can be cleanly flagged (`lock: true`) in `toc.js` and return a clear Vietnamese `Response.error(...)` per `AGENTS.md` §6.5.
   - **Full-series playback of Episodes 6–N (Option 2)**: **NO unsigned or `X-Gorgon`-only ByteDance App API exists as of `2026-11-20`**. All `fqnovel.com` / `snssdk.com` App endpoints silently return `HTTP 200 / 0 B` unless signed with ByteDance's proprietary native security SDK (`X-Argus` + `X-Ladon` or `X-Medusa` + `X-Helios`) and decrypted via `spade_a` CENC (with ByteVC2 codec pitfalls). Implementing Option 2 in MIT clean-room Rhino ES6 without copying GPL/unlicensed signing/DRM code and without an Android `VBOOK_SERVER` for ExoPlayer verification is **high-risk / blocked on house policy & verification**.
3. **Recommended Blueprint (if Orchestrator proceeds with Option 1 — Clean Public Web FQ Video)**:
   - **`source`**: `https://hongguoduanju.com` (or `https://fanqienovel.com` with `hongguoduanju.com` as primary API host in `config.js` `DOMAIN`/`MIRRORS` so `regexp` matches both `hongguoduanju.com/detail?series_id=\d+`, `hongguoduanju.com/player/\d+`, and `fanqienovel.com/page/\d+\?fq_type=(?:short|animation)`).
   - **`home.js`** (static tabs, zero fetch per `AGENTS.md` §6.9): `Phim ngắn Hot` (`/rank/hot-real-drama`), `Hoạt hình / Mạn kịch Hot` (`/rank/hot-comic-drama`), `Hoạt hình AI Hot` (`/rank/hot-ai-drama`), `BXH Tổng hợp` (`/rank/hot-drama`), `Phim ngắn mới` (`/category/real-drama`), `Mạn kịch / Hoạt hình` (`/category/comic-drama`), `Hoạt hình AI` (`/category/ai-drama`).
   - **`genre.js`** (static categories, zero fetch): All 24 `real-drama/<slug>` + 8 `comic-drama/<slug>` + 8 `ai-drama/<slug>` paths (exclude `/category/comic` static manga).
   - **`search.js`**: `GET https://hongguoduanju.com/api/search/result?query={q}&page={page}` (header `Referer: https://hongguoduanju.com/search`, guard query length 1–30 chars; handle HTTP 403 `search_verification_required` gracefully).
   - **`detail.js`**: `GET https://hongguoduanju.com/detail?series_id={id}` → extract `window._ROUTER_DATA.loaderData.detail_page.seriesDetail` + `seriesSocialInfo`; return `type: "video"`, `format: "series"` (or `"short"` for vertical 9:16 dramas), `ongoing: series_status !== 1`, `genres` chips, and note `"Web công khai mở 5 tập đầu (tập 6+ cần app gốc)"` in `detail`.
   - **`toc.js`**: Read `vid_list[]` from `hongguoduanju.com/detail?series_id={id}` (or `fanqienovel.com/api/reader/directory/detail?bookId={id}` for exact chapter titles), emit `lock: (index >= accessible_episode_cnt)` so users immediately see free vs app-gated episodes, and encode `https://hongguoduanju.com/player/{series_id}/{vid}` as episode URL.
   - **`chap.js`**: Return track list `[{ title: "HD 720p (Trực tiếp)", data: JSON.stringify({ seriesId, itemId, mode: "play-info" }) }, { title: "Tiêu chuẩn MP4 (Dự phòng)", data: JSON.stringify({ seriesId, itemId, mode: "fallback" }) }]` (or call `play-info` / `fallback-play-info` cleanly so only valid unencrypted tracks are listed).
   - **`track.js`**:
     1. Try `POST /api/video/protected/play-info` (`definition: "720p"`) → if `legacy_play_info.main_url` exists (Comic-Drama & AI-Drama), return `{ type: "native", data: url, mimeType: "video/mp4", headers: { "Referer": "https://hongguoduanju.com/" } }`!
     2. Otherwise (Live-Action Short Drama where `play_info` is CENC DASH `er=1`, or fallback track), call `POST /api/video/protected/fallback-play-info` (`{"item_id": itemId}`) → return `{ type: "native", data: res.main_url, mimeType: "video/mp4", headers: { "Referer": "https://hongguoduanju.com/" } }`!
     3. On HTTP 403 (`public_fallback_unavailable` / `protected_playback_unavailable`), return `Response.error("Tập này bị khóa trên web công khai (chỉ mở miễn phí 5 tập đầu; cần ứng dụng Fanqie / Hồng Quả để xem tiếp).")`.
   - **Pacing (`AGENTS.md` §6.11)**: `thread_num: 1`, `delay: 2000`, inline `rate-limit.js`, default runtime User-Agent (never rotate UA).

---

## 5. Verification Method

Any reviewer can independently reproduce every live observation with these read-only paced commands (respect ≥2–3s delay between requests to the same host):

1. **Verify `VBOOK_SERVER` state & read-only repo hygiene**:
   ```bash
   env | grep -i vbook || echo "no VBOOK env"
   curl -sS -m 2 -i http://127.0.0.1:18080/ || echo "unreachable"
   git -C /home/antigravity/qsang2025/Qsang_vbook status -s
   ```
   Expected: no `VBOOK_SERVER`, `127.0.0.1:18080` connection refused, zero tracked repo source files modified.

2. **Verify `hongguoduanju.com` Search, Category, Detail & `fanqienovel.com` Cross-Compatible TOC**:
   ```bash
   UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
   curl -sS -m 15 -A "$UA" -H "Referer: https://hongguoduanju.com/search" \
     "https://hongguoduanju.com/api/search/result?query=%E6%B1%82%E7%94%9F&page=1" | head -c 400
   sleep 3
   curl -sS -m 15 -A "$UA" \
     "https://fanqienovel.com/api/reader/directory/detail?bookId=7708355462780947518" | head -c 400
   ```
   Expected: HTTP 200 JSON with `searchList` (`genre: "205"` comic/AI dramas, `totalCount`) and `code: 0` with `chapterListWithVolume` (207 episodes).

3. **Verify Native Unencrypted MP4 Stream Resolution + Range Probe + Referer Whitelist + Ep 6 Gate**:
   ```bash
   UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
   # 1. 720p unencrypted Comic-Drama Ep1
   URL=$(curl -sS -m 15 -X POST -A "$UA" -H "Content-Type: application/json" -H "Origin: https://hongguoduanju.com" \
     -d '{"series_id":"7708355462780947518","item_id":"7708355470964050969","definition":"720p"}' \
     "https://hongguoduanju.com/api/video/protected/play-info" | python3 -c "import sys,json; print(json.load(sys.stdin)['legacy_play_info']['main_url'])")
   curl -sS -m 15 -A "$UA" -H "Referer: https://hongguoduanju.com/" -H "Range: bytes=0-1023" -D - -o /dev/null "$URL" | grep -iE '^(HTTP/|content-type|content-range)'
   sleep 3
   # 2. Ep 6 gate check (expect HTTP 403 public_fallback_unavailable)
   curl -sS -m 15 -X POST -A "$UA" -H "Content-Type: application/json" -H "Origin: https://hongguoduanju.com" \
     -d '{"item_id":"7706514796681628697"}' -w "\nHTTP:%{http_code}\n" \
     "https://hongguoduanju.com/api/video/protected/fallback-play-info"
   ```
   Expected: `HTTP/2 206`, `content-type: video/mp4`, `content-range: bytes 0-1023/...` (~21 MB) for Comic-Drama Ep 1; `HTTP:403` `{"error":"public_fallback_unavailable"}` for Ep 6.

4. **Verify Mobile App API AGW Silent-Empty Behavior**:
   ```bash
   curl -sS -m 15 -D - "https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/?aid=1967&version_code=73532&book_id=7706512650816982040" | grep -iE '^(HTTP/|content-length|x-agw-info|server-timing)'
   ```
   Expected: `HTTP/2 200`, `content-length: 0`, `x-agw-info` present.

5. **Invalidation Conditions**:
   - This specification is invalidated if ByteDance (a) changes `hongguoduanju.com` to require `a_bogus` / `bdturing` on `/api/video/protected/play-info`, `/api/video/protected/fallback-play-info`, or `/api/search/result`, (b) opens Ep 6+ on web (raising `accessible_episode_cnt`), (c) removes `legacy_play_info` / `fallback-play-info` unencrypted `er=0` MP4s, or (d) relaxes AGW signing on `api5-normal-sinfonline*.fqnovel.com`.
