# Handoff Report — `explorer_fqvideo_forks_1` (vBook Forks & FQ Video Reference Survey)

- **Agent**: `explorer_fqvideo_forks_1` (Explorer — Read-Only Investigation & Synthesis)
- **Dispatched by**: Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`)
- **Scope**: `ORIGINAL_REQUEST.md` → `## Follow-up — 2026-11-20T02:11:43Z` (Requirements #1 & #2)
- **UTC Start Time**: `2026-11-20T02:16:01Z`
- **UTC End Time**: `2026-11-20T02:23:25Z`
- **Elapsed Time**: `7m 24s` (`444s`)
- **Handoff Type**: **Hard** (Task complete; read-only; zero repo modifications; scratch dir verified removed)

> **Executive Summary**: Across 47+ vBook community repositories, local workspaces (`Qsang_vbook`, `vbook-extensions_Darkrai9x`, `muse-teamwork`), and global GitHub code search, **`duongden/vbook` is the ONLY vBook fork containing an `FQ Video` extension** (`type: "video"`, `https://fanqienovel.com`). Porting is **impossible and non-compliant** for two independent reasons: (1) `duongden/vbook` is licensed **GPL-3.0** (incompatible with `Qsang_vbook`'s **MIT** license), and (2) no source exists in the repo — the external zip (`vbook.trasua.workers.dev/.../FQ-video/plugin.zip`) has **`"encrypt": true`** with all 15 `src/*.js` files encrypted into unreadable ciphertext. **Recommendation: BUILD NEW clean-room** following `extensions/video/hhtqvietsub` (task 113) + `AGENTS.md` + `extension-api.md`, gated on `spec_miner_fqvideo_api_1` confirming a legal, free, Rhino-compatible direct API/native playback path (critical risk: the reference zip's manifest reveals `video_sign.js` [21 KB], `video_dash.js` [19.8 KB], `video_cenc.js` [25.5 KB], and `crypto_full.js` [101 KB], strongly signaling ByteDance API signing + DASH/CENC encryption).

---

## 1. Observation

### 1.1 Prior Internal Research (`muse-teamwork` & `Qsang_vbook/work/ext-review/`)

1. **`/home/antigravity/qsang2025/muse-teamwork/research/108-fanqie-fork-extensions.md`** (lines 1–117, researched 2026-11-19):
   - Audited 11 fork repos + 19 catalogs from `repository.json`; found **13 Fanqie-related extensions**.
   - Entries #1–#11 & #13 are all `novel`/`chinese_novel` text extensions (using third-party proxies like `gofq.52dns.cc`, `v2.czyl.cf`, `api.langge.cf`, `fqnovel.ceseet.me`, raw IPs, local Xposed server `FQWeb` on `localhost:9999`, or OpenLove token sign server).
   - Line 30 & line 73: **Entry #12 (`FQ Video v3`, type `video`, Đường đen — `duongden/vbook`)** was the sole video extension found; previously marked `"Zip host trên workers.dev ngoài repo nên chưa đọc được code"`.
   - Line 35: Confirmed `Darkrai9x/vbook-extensions` contains **0** Fanqie extensions.
2. **`/home/antigravity/qsang2025/muse-teamwork/research/109-fanqie-pua-verify.md`** (lines 1–81, 2026-11-19):
   - Tested `fanqienovel.com/api/reader/directory/detail?bookId=...` (public HTTP 200 without login) vs `fanqienovel.com/api/reader/full?itemId=...` (blocked by ByteDance Turing slide captcha `bdturing-verify` HTTP 200 / `Content-Length: 0`). Strictly concerned text novels (not video APIs).
3. **`/home/antigravity/qsang2025/Qsang_vbook/work/ext-review/FORK-SCAN-2026-11-17.md`** (lines 37–39, 68, 84) & **`FORK-SCAN-2026-11-17-not-in-registry.json`**:
   - Logged 400 non-registry extensions across community catalogs (47 `type: "video"`).
   - Only `duongden/vbook` had ByteDance short-drama video entries: `FQ Video` (commit `9e0bb00` `fix bug FQ Video`), `Hồng quả` (`hongguoduanju.com`), `Qimao Phim ngắn` (`api-gw.wtzw.com`).
4. **`/home/antigravity/qsang2025/muse-teamwork/tasks/113-build-extension-hhtq-vietsub-hhtq-press-.json`** & **`116-fix-hhtq-vietsub-khong-phat-duoc-track-t.json`**:
   - Task 113 built `extensions/video/hhtqvietsub` clean-room because Darkrai9x's `hhtqvietsub` was `encrypt: true`; merged to `Qsang_vbook` `main` (`38f97e8`) with `validate` PASS and device test 8/8.
   - Task 116 (claimed) documents a key video lesson: returning `type: "auto"` on an embed page can pass `device_test` (`code 0`) yet fail real playback (`"Không thể tải máy chủ này"`), so video extensions should verify `track.js` returns playable **`type: "native"`** streams whenever possible.

### 1.2 Local Repositories Inspection

1. **`/home/antigravity/qsang2025/Qsang_vbook/extensions/`**:
   - Command: `find /home/antigravity/qsang2025/Qsang_vbook/extensions/ -maxdepth 2 -iname '*fanqie*' -o -iname '*fq*' -o -iname '*cachua*'` → **0 matches**.
   - Existing `extensions/video/` directories (3 total):
     - `extensions/video/hhtqvietsub` (`plugin.json`: `type: "video"`, `locale: "vi_VN"`, `encrypt: false`, `author: "MuseAi"`, scripts: `home`, `genre`, `search`, `detail`, `toc`, `chap`, `track`; libs inlined: `config-helpers.js`, `fetch-helpers.js`, `rate-limit.js`, plus `config.js`, `helper.js`, `test.json`, `health.json`, `README.md`, `plugin.zip`).
     - `extensions/video/hoathinh3d` (`phimapi.com`, `type: "video"`, `encrypt: false`, direct `.m3u8` native).
     - `extensions/video/hoathinh_ai` (`dailymotion.com`, `type: "video"`, `encrypt: false`, direct `.m3u8` native, also includes `comment.js`).
   - Root `LICENSE`: **MIT** (`README.md:205`, `AGENTS.md:148`).
2. **`/home/antigravity/qsang2025/vbook-extensions_Darkrai9x/`**:
   - Command: `grep -rniE 'fanqie|fqvideo|fq video|fqnovel|"type"\s*:\s*"video"' /home/antigravity/qsang2025/vbook-extensions_Darkrai9x/ --include='plugin.json' --include='*.js'`
   - **0 Fanqie/FQ matches**.
   - 9 video extensions exist (`allshorts`, `gamomephim`, `hhkungfu`, `hhtqvietsub`, `motchill`, `pinedrama`, `shortmax`, `vieflix`, `yanhh3d`); inspected `allshorts`, `pinedrama`, `shortmax`, `hhtqvietsub` — all four have `"encrypt": true` in `plugin.json` and unreadable `src/*.js`.

### 1.3 Comprehensive GitHub Survey via `gh` CLI (Authenticated as `qsang2025`)

Global GitHub code searches run via `gh search code`:
- `gh search code '"FQ Video"'` → **1 result total across all of GitHub**: `duongden/vbook` (`plugin.json`).
- `gh search code 'vbook.trasua'` → **1 result total**: `duongden/vbook` (`plugin.json`).
- `gh search code '"FQ-video"'` → **0 results**.
- `gh search code 'fanqienovel.com "type": "video"'` → **0 results**.
- `gh search code '"fanqienovel.com" "track.js"'` → **0 results**.
- `gh search code 'fq_type'` → **0 vBook results** (only math/crypto `libff` finite-field `Fq` matches).
- `gh search code 'fqvideo'` → **0 vBook results** (matched unrelated repos: `hanliang97/MatrixMedia`, `crazypig321/FQHouseOH` [GPL-3.0], `Erlmo/shortplay` [NONE license, desc `"番茄/红果短剧drm解密播放器"`], `oyjjforever/comic-reader`, etc.).

Direct API audit (`gh api repos/<owner>/<repo>` + `plugin.json` catalog inspection) across **47 vBook repositories + 1 external catalog**:

| # | Repository / Source | URL | License (SPDX) | Fanqie / FQ Video Status | Source Readable? |
|---|---|---|---|---|---|
| 1 | **`duongden/vbook`** | https://github.com/duongden/vbook | **GPL-3.0** | **ONLY fork with `FQ Video` v3 (`type: "video"`, `https://fanqienovel.com`)**; also `Hồng quả` v17 (`hongguoduanju.com`) & `Qimao Phim ngắn` v7 (`api-gw.wtzw.com`) | **NO** — `FQ-video` not in repo (`video/` only has `douyin`, `hongguo`, `tramb`); external zip & `hongguo`/`qimao` zips are all **`encrypt: true`** |
| 2 | `duongden/vbook_news` | https://github.com/duongden/vbook_news | **GPL-3.0** | Docs repo only (`phim-anh-am-nhac/gioi-thieu.md` notes video requires vBook beta; `nguon-mo-rong/ca-chua.md` lists only novel sources) | Docs only (no extension code) |
| 3 | `Darkrai9x/vbook-extensions` | https://github.com/Darkrai9x/vbook-extensions | **NONE** | 0 Fanqie/FQ; 9 video extensions (`allshorts`/`pinedrama`/`shortmax`/`hhtqvietsub` encrypted) | Encrypted (`encrypt: true`) |
| 4 | `kychitoge/vbook-ext` | https://github.com/kychitoge/vbook-ext | **NONE** | 0 FQ Video; 10 other video exts (Vietnamese anime/movies); Fanqie novel only (`[Fanqie] Cà Chua C2`, `Cà Chua Sói Xám`) | Novel only (proxy-based) |
| 5 | `mizhm/vbook-extensions` | https://github.com/mizhm/vbook-extensions | **NONE** | 0 video; Fanqie novel only (`Cà Chua` v9, third-party IP proxy) | Novel only |
| 6 | `sonzin/vbook-extension` | https://github.com/sonzin/vbook-extension | **NONE** | 0 video; 0 Fanqie (9 Vietnamese novel/comic extensions) | N/A |
| 7 | `lethituyen/vbooks-extension` (Nhocconsr catalog) | https://github.com/lethituyen/vbooks-extension | **NONE** | 0 video; 0 Fanqie (41 novel exts) | N/A |
| 8 | `Cachkomuoi/vbook` (mirrors `nhocconsr/vbook-ext`) | https://github.com/Cachkomuoi/vbook | **NONE** | 0 video; `Fanqie Novel` v12 (`novel`, old 2023 Nhocconsr); `users/nhocconsr/repos` empty | Novel only |
| 9 | `SoulGodEve9x9/Vbook-ext` (`Nahona`) | https://github.com/SoulGodEve9x9/Vbook-ext | **NONE** | 0 video; `Fanqienovel - LV` v4 (`chinese_novel`, proxy) | Novel only |
| 10 | `WillSun28/vbook-extensions` | https://github.com/WillSun28/vbook-extensions | **NONE** | 0 FQ Video (3 other video exts); `Sói Xám (Fanqie)` v24 (`chinese_novel`, encrypted) | Encrypted novel |
| 11 | `dat-bi/ext-vbook` (B) | https://github.com/dat-bi/ext-vbook | **NONE** | 0 FQ Video (3 NSFW video exts); `5in1` v70 (`chinese_novel`, proxy) | Novel only |
| 12 | `BaoBao666888/ext-vbook-w` (QuocBao) | https://github.com/BaoBao666888/ext-vbook-w | **NONE** | 0 Fanqie/FQ; 15 video exts (`WeTV`, `YOUKU`, `MGTV`, `TikTok`, `FreeReels`, `iQIYI`, `Bilibili`, `YouTube`, etc.) | No FQ Video |
| 13 | `Ivan1hai/ext` (ivanzzz) | https://github.com/Ivan1hai/ext | **NONE** | 0 Fanqie/FQ; 11 Vietnamese movie/anime video exts | No FQ Video |
| 14 | `yae-miko-313/ext-vbook` (hieu05) | https://github.com/yae-miko-313/ext-vbook | **NONE** | 0 FQ Video (2 `NguonC` video exts); copies kychi `Cà Chua C2` novel | Novel only |
| 15 | `TuanHai03/vbook-extensions` (TH03) | https://github.com/TuanHai03/vbook-extensions | **NONE** | 0 video; `fanqieweb` v1 (`chinese_novel`, `localhost:9999`) | Novel only |
| 16 | `Chanhnh/vbook-ext` | https://github.com/Chanhnh/vbook-ext | **NONE** | 0 FQ Video (1 IPTV `Xem tiVi` video ext); `FQWeb Universal` v3 (`chinese_novel`, `localhost:9999`) | Novel only |
| 17 | `laodai123/vbook-plugins-collection` | https://github.com/laodai123/vbook-plugins-collection | **MIT** (aggregator) | 0 FQ Video; re-hosts 7 third-party Fanqie novel zips (`Chanhnh`, `Nahona`, `TH03`, `Will Sun`, `bqy`, `kychi`, `mizhm`) | Novel only (unlicensed upstream zips) |
| 18 | `ustaezav/vbook-ext` | https://github.com/ustaezav/vbook-ext | **NONE** | 0 Fanqie/FQ (17 video exts, mostly NSFW/JAV + `2048AI`) | No FQ Video |
| 19 | `KyCtG/vbook-ext-fanqie` | https://github.com/KyCtG/vbook-ext-fanqie | **NONE** | 0 video; single `chinese_novel` (`ftomato`) | Novel only |
| 20 | `TekMonts/vbook-fanqie-ext` | https://github.com/TekMonts/vbook-fanqie-ext | **NONE** | 0 video; single `chinese_novel` (Vercel proxy `server.js`) | Novel only |
| 21 | `DHaiPhong/vbook-fanqie` | https://github.com/DHaiPhong/vbook-fanqie | **NONE** | 0 video; single `novel` (`Fanqie 番茄小说` v3, third-party proxy) | Novel only |
| 22 | `devanenWl/fanqie_vbook` | https://github.com/devanenWl/fanqie_vbook | **NONE** | 0 video; `Fanqie API` v2 & v6 (`chinese_novel`) | Novel only |
| 23 | `vb-source.open-love.app/source` | https://vb-source.open-love.app/source | **Proprietary / NONE** | 0 video; 1 entry: `Fanqie OpenLove` v20 (`chinese_novel`, requires token claim) | Novel only |
| 24–47 | Remaining 24 community vBook repos (`hajljnopera/vbook-ext`, `Moleys/vbook-ext`, `gh369-639/vbook-ext-public`, `Gold2k2k2k/HTri-Vbook-Ext`, `hienpro00123/vbook_MeoU`, `Evamirion/vbook-ext`, `kur21/vbook-ext`, `Holozok/vbook-extensions`, `DuongKhang2810/vbook-extensions`, `andyhoanghieu/vbook-extension`, `quydo144/vBook`, `andyhoangds/andy-vbook-ext`, `IHuy123/vbook-extensions`, `juneapil/ext-vbook`, `hacmailau/vbook-ext-pi`, `PrimoGin/vbook-extensions`, `tobiiex/vbook-mr` [MIT], `NPH-DrS/vbook-ext`, `Vnshiro/My_Vbook_ext`, `phineas-pta/my-vbook-ext` [MIT], `hiimgyn/vbook-personal`, `SevenOcean27/vbook-ext`, `FFrelay/vbook-extensions`, `aleshanotdancer/vbook-exts`, `alexsonxxx/vbook`, `longvuu/ext`) | GitHub (`gh api` verified) | **NONE** (except `tobiiex/vbook-mr` & `phineas-pta/my-vbook-ext`: MIT) | **0 `FQ Video` extensions** across all 24 repos | N/A |
| 48 | `DatTran` / `hoangmanh` | Searched via `gh api search/repositories` & `search/users` | N/A | **No public GitHub vBook extension repositories found** matching `DatTran` or `hoangmanh` | N/A |
| Ref (non-vBook) | `Erlmo/shortplay` | https://github.com/Erlmo/shortplay | **NONE** | Non-vBook Flutter app: `"番茄/红果短剧drm解密播放器"` (Fanqie/Hongguo short drama DRM decryption player) | Unlicensed — DO NOT copy |
| Ref (non-vBook) | `crazypig321/FQHouseOH` | https://github.com/crazypig321/FQHouseOH | **GPL-3.0** | Non-vBook HarmonyOS app (`FqVideoMedia.ets`) | GPL-3.0 — DO NOT copy |

### 1.4 Reference Plugin Inspection: `FQ Video` v3 (`duongden/vbook` — Behavioral Comparison ONLY)

**Git history in `duongden/vbook`** (verified via `gh api repos/duongden/vbook/commits`):
- Introduced `2026-11-08T12:05:53Z` (commit `2ece453`, `"update comment chap"`) as `version: 1`.
- Updated `2026-11-17T05:19:34Z` (commit `9e0bb00`, `"fix bug FQ Video"`) from `version: 1` → `version: 3`.
- Never stored inside `duongden/vbook/video/`; always referenced externally via Cloudflare Workers (`https://vbook.trasua.workers.dev/s/SMVfAou7fZmyjrMHiGNy_A/FQ-video/plugin.zip`).

**Catalog entry in `duongden/vbook/plugin.json`** (verbatim):
```json
{
  "name": "FQ Video",
  "author": "Đường đen",
  "path": "https://vbook.trasua.workers.dev/s/SMVfAou7fZmyjrMHiGNy_A/FQ-video/plugin.zip",
  "version": 3,
  "source": "https://fanqienovel.com",
  "icon": "https://vbook.trasua.workers.dev/s/SMVfAou7fZmyjrMHiGNy_A/FQ-video/icon.png",
  "description": "Phim ngắn và hoạt hình Fanqie, API trực tiếp và phát native; không cần root.",
  "type": "video",
  "locale": "zh_CN"
}
```

**Public zip archive inspection** (downloaded to scratch dir, metadata & file table verified, scratch dir immediately removed and confirmed absent):
- HTTP Status: `200 OK`, `content-length: 143267` bytes, `last-modified: Tue, 17 Nov 2026 05:18:41 GMT`, `etag: "999e5ac4b7cf0ed08fa2dbe3ee8650db"`.
- **Exact `plugin.json` inside `FQ-video/plugin.zip`** (verbatim, 953 bytes):
```json
{
  "metadata": {
    "name": "FQ Video",
    "author": "Đường đen",
    "version": 3,
    "source": "https://fanqienovel.com",
    "regexp": "https?://(?:[^/]+\\.)?(?:fanqienovel|fqnovel|snssdk|changdunovel)\\.com/page/\\d+\\?fq_type=(?:short|animation)(?:&[^ ]*)?",
    "description": "Phim ngắn và hoạt hình Fanqie, API trực tiếp và phát native; không cần root.",
    "locale": "zh-CN",
    "language": "javascript",
    "type": "video",
    "encrypt": true
  },
  "script": {
    "home": "home.js",
    "detail": "detail.js",
    "genre": "genre.js",
    "toc": "toc.js",
    "search": "search.js",
    "chap": "chap.js",
    "track": "track.js"
  },
  "config": {
    "VIDEO_QUALITY": {
      "title": "Chất lượng phim (thấp hơn sẽ giảm bộ nhớ)",
      "mode": "select",
      "values": ["360", "480", "540", "720"],
      "default": "360"
    },
    "thread_num": 1
  }
}
```
- **Encryption verification & archive file list** (`unzip -l`, 17 files, 204,677 bytes uncompressed):
  - **Every single JS file (15/15)** has `lines=0`, `has_execute=0`, and consists of opaque vBook encrypted strings containing `x0P1Xx` / `x0P2Xx` markers (`"encrypt": true`). **Zero readable JavaScript source exists.**
  - File breakdown (names & byte sizes from zip directory header ONLY):
    - Metadata/Assets: `plugin.json` (953 B), `icon.png` (8,142 B)
    - Entrypoint wrappers: `src/home.js` (281 B), `src/genre.js` (281 B), `src/gen.js` (355 B), `src/search.js` (330 B), `src/detail.js` (355 B), `src/toc.js` (355 B), `src/chap.js` (355 B), `src/track.js` (444 B)
    - Config & core modules: `src/config.js` (2,027 B), `src/video.js` (10,082 B), `src/video_api.js` (13,417 B)
    - **High-complexity protocol/DRM modules**: `src/video_sign.js` (20,974 B), `src/video_dash.js` (19,797 B), `src/video_cenc.js` (25,502 B), `src/crypto_full.js` (101,027 B).
  - Note: Sibling ByteDance video plugin `duongden/vbook/video/hongguo/plugin.zip` (`Hồng quả` v17, GPL-3.0) was also checked in-memory — identically **`"encrypt": true`** (20/20 `src/*.js` unreadable), with analogous module names (`sign.js` [63 KB], `dash.js` [19.5 KB], `cenc.js` [34.4 KB], `crypto_full.js` [100.8 KB], `playback_api.js`, `playback_v5.js`).

### 1.5 Contract & Template Baseline (`Qsang_vbook`)

- **`extensions/video/hhtqvietsub`** (task 113, `main` commit `38f97e8`):
  - Manifest: `author: "MuseAi"`, `encrypt: false`, `locale: "vi_VN"`, `type: "video"`, `nsfw: false`, `config`: `DOMAIN` + `MIRRORS`, `script`: `home`, `genre`, `search`, `detail`, `toc`, `chap`, `track`.
  - Architecture: `home.js` returns static tabs only (no network fetch — `AGENTS.md` §6.9); `genre.js` returns static category list; `search.js` serves both keyword search and list tabs; `detail.js` returns `{name, author, cover, description, detail, url, type: "video", format: "series", ongoing, genres}`; `toc.js` lists episodes; `chap.js` lists server/quality tracks (`[{title, data}]`); `track.js` resolves to `type: "native"` (priority 1) or `type: "auto"` (fallback), with `config-helpers.js`, `fetch-helpers.js`, `rate-limit.js` inlined from `lib/`.
  - Fixtures: `test.json` (8 cases covering all scripts) + `health.json` (CI probe cases) + `README.md` + `plugin.zip`.
- **`extension-api.md` (lines 933–1150)**:
  - `detail.js`: `type: "video"`, `format: "series" | "stream" | "short"` (line 1042).
  - `track.js` `native` resolver (lines 1112–1127): accepts absolute `http(s)` media URL (`.m3u8`, `.mp4`, `.mkv`, `.webm`, …), HLS `data:` URI (`mpegurl`), or raw `#EXTM3U` text. Explicitly states: **"Anything else (relative URL, DASH/MP4 `data:` URI) is an error."**
  - `track.js` `drm` field (line 1006): supports ClearKey `{ scheme: "clearkey", keys }` (`kid:key` hex pairs or EME JWK JSON; shorthand `clearKey`/`clearkey`).

---

## 2. Logic Chain

1. **No portable base exists in any vBook fork** (Obs 1.1, 1.2, 1.3):
   - Of 47+ vBook GitHub repos, `vbook-extensions_Darkrai9x`, `Qsang_vbook`, and `vb-source.open-love.app`, **only `duongden/vbook`** has an `FQ Video` (`type: "video"`) entry.
   - All other Fanqie extensions across forks (`kychitoge`, `mizhm`, `Nahona`, `WillSun28`, `TuanHai03`, `Chanhnh`, `Cachkomuoi`/`Nhocconsr`, `dat-bi`, `KyCtG`, `TekMonts`, `DHaiPhong`, `devanenWl`, `OpenLove`) are exclusively **text novel** extensions (`novel`/`chinese_novel`) and have no video endpoints, no `track.js`, and no MIT-compatible license.
2. **Porting from `duongden/vbook` is doubly blocked** (Obs 1.3, 1.4):
   - **Legal / License blocker**: `duongden/vbook` carries a `GPL-3.0` `LICENSE` file (`AGENTS.md` §11 explicitly flags `vbook_duongden` as the 1/33 repo with a license; `Qsang_vbook` is `MIT`). Copying or deriving code from a GPL-3.0 repo into an MIT repo violates license compatibility.
   - **Technical blocker**: `duongden/vbook` does not store `FQ-video` source in Git, and the external zip on `vbook.trasua.workers.dev` has `"encrypt": true` with all 15 `src/*.js` encrypted (`has_execute=0`). Even ignoring licensing, there is zero readable code to port — the exact same situation as Darkrai9x's encrypted `hhtqvietsub` in task 113 (Obs 1.1, 1.2).
3. **Therefore, clean-room BUILD NEW is the only compliant option** (Step 1 + Step 2 → `AGENTS.md` §6.7, §11):
   - Following `extensions/video/hhtqvietsub` (task 113) gives the proven `Qsang_vbook` video scaffold (`encrypt: false`, `author: "MuseAi"`, `locale: "zh_CN"`, `DOMAIN` + `MIRRORS` config, `lib/` inline helpers, Rhino ES6 compliance, `test.json` + `health.json`).
4. **CRITICAL TECHNICAL RISK flagged by behavioral/manifest evidence** (Obs 1.3, 1.4, 1.5):
   - The reference `FQ Video` v3 zip manifest reveals 4 heavy non-trivial modules: `video_sign.js` (21 KB), `video_dash.js` (19.8 KB), `video_cenc.js` (25.5 KB), and `crypto_full.js` (101 KB), plus a `VIDEO_QUALITY` warning (`"thấp hơn sẽ giảm bộ nhớ"`, default `360p`) and `thread_num: 1`.
   - Independently, `Erlmo/shortplay` (non-vBook, unlicensed) describes Fanqie/Hongguo short-drama playback as `"番茄/红果短剧drm解密播放器"`, and `duongden/vbook/video/hongguo` mirrors the same `sign.js` + `dash.js` + `cenc.js` + `crypto_full.js` architecture.
   - Meanwhile, `Qsang_vbook`'s `AGENTS.md` prohibits copying unlicensed/GPL code, prohibits `encrypt: true`, prohibits bypassing VIP/paywalls or hardcoding auth tokens, and requires pure Rhino ES6 passing `scripts/cli.js validate` (`node --check` + Rhino ES6 linter).
   - Consequently, **`spec_miner_fqvideo_api_1`'s live API investigation is a mandatory Go/No-Go gate**: if Fanqie's public web/API video endpoints return unencrypted `.mp4`/`.m3u8` URLs (or ClearKey-compatible streams using `extension-api.md:1006` `drm: { scheme: "clearkey", keys }`) without requiring reverse-engineered proprietary ByteDance binary signing or DRM circumvention, a clean-room `Qsang_vbook` extension is straightforward; if ALL playable video streams require ByteDance proprietary device signing + CENC/DRM decryption/remuxing in Rhino, the team must evaluate feasibility, memory limits, and house policy ("không bypass paywall/DRM") before committing to implementation.

---

## 3. Caveats

1. **Encrypted reference internals not readable (and must not be reversed/copied)**: Because `FQ-video/plugin.zip` is `"encrypt": true` (and `duongden/vbook` is GPL-3.0), exact home tab names, genre list labels, and internal Fanqie API URLs used inside `FQ Video` v3 could NOT be inspected from the zip. Only public `plugin.json` metadata, catalog description, and zip file listing were observed. If exact UI parity with the user's installed copy of `FQ Video` is desired, the user can share screenshots of its Home/Genre tabs from their phone (or `spec_miner_fqvideo_api_1` can map live categories directly from `fanqienovel.com`).
2. **Live Fanqie video API endpoints not probed in this report**: By design (separation of roles), live HTTP probing of `fanqienovel.com` video/short-drama/animation pages & APIs is owned by `spec_miner_fqvideo_api_1`, not this fork survey.
3. **No device test server available on this VM**: As documented in `ORIGINAL_REQUEST.md:30`, `VBOOK_SERVER` (`127.0.0.1:18080`) is unreachable from this cloud VM, so we could not query the user's phone directly for `FQ Video`'s runtime output.
4. **`DatTran` and `hoangmanh` GitHub search**: Searching GitHub repos/users for `DatTran` and `hoangmanh` with vBook keywords yielded 0 public vBook extension repos. If either author publishes under an unrelated GitHub handle not listed in `repository.json` or GitHub `vbook` search results, it would not appear in this scan.
5. **GitHub code search rate limit**: One `gh search code` call (`fanqienovel.com filename:plugin.json`) hit GitHub's 10 req/min code-search limit; compensated by directly querying all 47 candidate repos via `gh api repos/.../contents/plugin.json` and re-running targeted `gh search code` queries (`fq_type`, `"fanqienovel.com" "track.js"`) after the window reset.

---

## 4. Conclusion

### Decision: **DO NOT PORT — BUILD NEW Clean-Room** (gated on `spec_miner_fqvideo_api_1` live API Go/No-Go)

- **Why NOT PORT**: Zero MIT/compatible readable `FQ Video` extension exists in any vBook fork. The sole existing implementation (`duongden/vbook` → `FQ Video` v3) is both **GPL-3.0** (license-incompatible with MIT `Qsang_vbook`) and **fully encrypted (`encrypt: true`)** on an external Cloudflare Worker (`vbook.trasua.workers.dev`).
- **How to BUILD NEW**: Scaffold clean-room under `extensions/video/fqvideo/` (or agreed slug) using `extensions/video/hhtqvietsub` (task 113) + `AGENTS.md` + `extension-api.md` as the template, incorporating behavioral requirements derived from the reference `FQ Video` v3 surface below — **ONLY AFTER** `spec_miner_fqvideo_api_1` confirms a clean, free, Rhino-ES6-compatible direct API & `native` playback path without paywall/DRM bypass.

### Feature Comparison Table: Reference `FQ Video` v3 vs `hhtqvietsub` (Task 113) vs Proposed Clean-Room `Qsang_vbook` FQ Video

| Dimension | Reference `FQ Video` v3 (`duongden/vbook` — đối chiếu) | Template `hhtqvietsub` v1 (`Qsang_vbook`, task 113) | Proposed Clean-Room `Qsang_vbook` `fqvideo` |
|---|---|---|---|
| **License & Source** | GPL-3.0 catalog; zip hosted off-repo (`vbook.trasua.workers.dev`), **`encrypt: true`** (unreadable) | MIT; plaintext `src/*.js` + `plugin.zip` in repo (`encrypt: false`) | MIT; plaintext `src/*.js` + `plugin.zip` in repo (**`encrypt: false`** per `AGENTS.md` §6.7) |
| **Author** | `Đường đen` | `MuseAi` | `MuseAi` (strict `AGENTS.md` §11 rule) |
| **Type & Locale** | `type: "video"`, `locale: "zh-CN"` (non-standard hyphen in zip `plugin.json`) | `type: "video"`, `locale: "vi_VN"` | `type: "video"`, `locale: "zh_CN"` (strict underscore per `AGENTS.md` §6.6) |
| **Source URL** | `https://fanqienovel.com` | `https://hhtq.press` | `https://fanqienovel.com` (configurable via `DOMAIN` + `MIRRORS` in `config.js`) |
| **Content Scope** | Phim ngắn (`short`) + hoạt hình (`animation`) Fanqie | Hoạt hình 3D TQ Vietsub (`series`) | Phim ngắn (`short`) + hoạt hình (`animation`) Fanqie (free public content only) |
| **URL `regexp`** | `https?://(?:[^/]+\.)?(?:fanqienovel\|fqnovel\|snssdk\|changdunovel)\.com/page/\d+\?fq_type=(?:short\|animation)(?:&[^ ]*)?` | `^https://hhtq\.press/[^/\?]+/?$` | Support canonical Fanqie video/drama URLs (both live site URLs verified by `spec_miner_fqvideo_api_1` and `?fq_type=(?:short\|animation)` if helpful for link sharing) |
| **Script Lifecycle** | `home`, `genre`, `search`, `detail`, `toc`, `chap`, `track` (+ `gen.js` helper, `config.js`) | `home`, `genre`, `search`, `detail`, `toc`, `chap`, `track` (+ `config.js`, `helper.js`, inlined `lib/*`) | Same 7-script lifecycle (`home`, `genre`, `search`, `detail`, `toc`, `chap`, `track`) + `config.js` + shared helpers + inlined `lib/` (`config-helpers.js`, `fetch-helpers.js`, `rate-limit.js`) |
| **Home / Genre Tabs** | Static tabs delegated to `gen.js` (281B stubs) | Static tabs only (`home.js` 4 tabs, `genre.js` 14 tabs), no fetch (`AGENTS.md` §6.9), delegated to `search.js` | Static tabs in `home.js` & `genre.js` (zero fetch), covering Phim ngắn (短剧) + Hoạt hình/Manju (漫剧/动画) categories discovered live |
| **User Config** | `VIDEO_QUALITY` (`360`/`480`/`540`/`720`, default `360`), `thread_num: 1` | `DOMAIN` (select), `MIRRORS` (input) | `DOMAIN` + `MIRRORS` (house standard) + optional `VIDEO_QUALITY` select if API exposes multiple renditions (`360`/`480`/`540`/`720`/`1080`) |
| **API & Playback Pipeline** | Direct API + `native` playback, no root; zip reveals heavy `video_sign.js` + `video_dash.js` + `video_cenc.js` + `crypto_full.js` (101 KB) | WordPress HTML/AJAX → `player.php` embed → `track.js` tries `native` then `auto` (task 116 notes `auto` failed real Play) | **Direct JSON API → `track.js` returns `type: "native"`** (direct `.mp4`/`.m3u8` URL or ClearKey `drm` if legally supported by vBook runtime); **no third-party proxy, no root, no hardcoded tokens, no paywall bypass** |
| **Validation & Fixtures** | None (no `test.json`/`health.json`, fails `Qsang_vbook` linter due to `encrypt: true` & `zh-CN`) | `test.json` (8 cases), `health.json` (3 cases), `README.md`, `validate` PASS, device test 8/8 | Must include `test.json` (all 7 scripts + real `track.js` native assertion), `health.json`, `README.md`, pass `node scripts/cli.js validate` (Rhino ES6 + `node --check` + lib md5 + zip sync) |

### Key Handoff Action for Orchestrator / Next Agents
- Pass the **manifest complexity alert** (`video_sign.js`, `video_dash.js`, `video_cenc.js`, `crypto_full.js`, 4 domains `fanqienovel|fqnovel|snssdk|changdunovel`, `fq_type=short|animation`, `VIDEO_QUALITY` memory note) to **`spec_miner_fqvideo_api_1`** so they explicitly verify:
  1. Whether `fanqienovel.com` has unauthenticated, unsigned (or cleanly signable in pure Rhino ES6) public JSON APIs for short dramas (`短剧`) and animations (`漫剧`/`动画`).
  2. Whether video stream URLs returned by those APIs are plain `.mp4`/`.m3u8` (directly playable via `type: "native"`) OR CENC-encrypted DASH/MP4 requiring key extraction/decryption (and if ClearKey, whether `extension-api.md:1006` `drm: { scheme: "clearkey", keys }` works natively without 100 KB JS crypto or OOM).
  3. Whether free episodes are cleanly distinguishable from locked/VIP episodes so locked ones return a clear Vietnamese `Response.error(...)` per `AGENTS.md` §6.5.

---

## 5. Verification Method

Any reviewer can independently reproduce every observation in this report using these read-only commands:

1. **Verify `Qsang_vbook` & `Darkrai9x` have zero Fanqie extensions**:
   ```bash
   find /home/antigravity/qsang2025/Qsang_vbook/extensions -maxdepth 2 -iname '*fanqie*' -o -iname '*fq*'
   grep -rniE 'fanqie|fqvideo|fq video' /home/antigravity/qsang2025/vbook-extensions_Darkrai9x --include='plugin.json' --include='*.js'
   ```
   Expected: empty output for both.

2. **Verify `duongden/vbook` license (GPL-3.0), `FQ Video` catalog entry, and absence of `FQ-video` in `video/`**:
   ```bash
   gh repo view duongden/vbook --json licenseInfo,url,pushedAt
   gh api repos/duongden/vbook/contents/video --jq '.[].name'
   gh api repos/duongden/vbook/contents/plugin.json --jq .content | base64 -d | jq '.data[] | select(.name == "FQ Video")'
   ```
   Expected: `licenseInfo.key == "gpl-3.0"`, `video/` contains only `douyin`, `hongguo`, `tramb`, and `FQ Video` v3 points to `https://vbook.trasua.workers.dev/s/SMVfAou7fZmyjrMHiGNy_A/FQ-video/plugin.zip`.

3. **Verify global GitHub search for `FQ Video` / `vbook.trasua`**:
   ```bash
   gh search code '"FQ Video"' --json repository,path
   gh search code 'vbook.trasua' --json repository,path
   ```
   Expected: only `duongden/vbook` (`plugin.json`).

4. **Verify `FQ-video/plugin.zip` encryption & metadata in memory (no temp files written)**:
   ```bash
   python3 -c '
   import urllib.request, zipfile, io, json
   data = urllib.request.urlopen("https://vbook.trasua.workers.dev/s/SMVfAou7fZmyjrMHiGNy_A/FQ-video/plugin.zip", timeout=15).read()
   z = zipfile.ZipFile(io.BytesIO(data))
   print("count:", len(z.infolist()), "files:", [(i.filename, i.file_size) for i in z.infolist()])
   print(z.read("plugin.json").decode())
   print("plain_js_count:", sum(1 for n in z.namelist() if n.endswith(".js") and b"function execute" in z.read(n)))
   '
   ```
   Expected: `17` files, `"encrypt": true`, `plain_js_count: 0`.

5. **Verify read-only workspace hygiene (no repo edits, scratch dir cleaned)**:
   ```bash
   git -C /home/antigravity/qsang2025/Qsang_vbook status -s
   ls /home/antigravity/.gemini/jetski/scratch/teamwork_tmp/a1ba902eed4129cf7c8a551b60e577b6 2>&1 || true
   ```
   Expected: no modified tracked source files; scratch dir does not exist.

6. **Invalidation Conditions**:
   - This recommendation ("DO NOT PORT") would only be invalidated if a new public MIT/Apache/BSD-licensed vBook repository publishes unencrypted, readable `FQ Video` (`fanqienovel.com`, `type: "video"`) source code after `2026-11-20T02:23:25Z`, OR if `duongden` explicitly relicenses and unencrypts `FQ-video` under an MIT-compatible license.
