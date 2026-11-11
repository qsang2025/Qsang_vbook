# Context: Port vBook Extension QuyKhu (quykhu.com)

- **Date**: 2026-11-11
- **Working Branch**: `feature/quykhu-ag`
- **Target Location**: `/home/antigravity/qsang2025/Qsang_vbook/extensions/novel/quykhu`

---

## 1. Verified Facts from Reconnaissance

1. **Repo Status**:
   - `Qsang_vbook` checked out to clean branch `feature/quykhu-ag` from commit `d8ac02f` (`main` tip).
   - Validation suite `node scripts/cli.js validate` currently passes cleanly (29/29 sources pass with 0 warnings).

2. **Network Probe (`quykhu.com`)**:
   - Direct raw `curl -I -s -m 10 https://quykhu.com` returned **HTTP 403** (Cloudflare LiteSpeed WAF rule blocking default curl UA / missing headers).
   - Request with headers `Accept-Language: vi-VN,vi;q=0.9` and browser UA returned **HTTP 200 OK** with session cookies (`XSRF-TOKEN`, `quykhu_sess_v3`, LiteSpeed tags).
   - This confirms the finding in mizhm's base: quykhu.com requires `"Accept-Language": "vi-VN,vi;q=0.9"` on requests.

3. **Base Code Analysis**:
   - **Primary Base**: `/home/antigravity/qsang2025/vbook-extensions_mizhm/vozer/`
     - Metadata: `name: "Vozer"`, `version: 6`, `source: "https://quykhu.com"`, regexp `https://(vozer.io|quykhu.com)/(.*?)$`.
     - Scripts: `config.js`, `home.js`, `genre.js`, `detail.js`, `search.js`, `toc-page.js`, `toc.js`, `chap.js`, `gen.js`.
     - Content Decryption: Quykhu serves content as XOR-encrypted base64 string via a secondary endpoint with CSRF and content-token headers. Mizhm's implementation has a clean `xorDecode` using CryptoJS (`words.words[i >>> 2] ^= k << shift`).
     - TOC Handling: Supports lazy catalog with dynamic POST requests to `/post/<id>/chapters` using CSRF token extracted from the page. Handles pagination efficiently using URL templates (`chuong-{n}`).
     - **Defects to fix in mizhm base**:
       - Uses `const` / `let` extensively (Rhino ES6 requires `var`).
       - `home.js` loads `config.js` and fetches `BASE_URL + "/"` (violates House Rule 6.9: home.js must return static tabs).
       - Error handling has English fallbacks ("Failed to fetch data") instead of Vietnamese.
       - Missing `test.json` and `health.json`.
       - Manifest has `local: "vi-VN"` instead of `locale: "vi_VN"`.
       - Needs rate-limit delay integration (`rateLimitDelay()`).
   - **Backup Base**: `/home/antigravity/qsang2025/vbook-ext_kychitoge/extensions/novel/kychi_quykhu/`
     - Uses `Engine.newBrowser()` which is slower and dependent on WebView browser engine, though it provides fallback selectors.
     - Mizhm's API-based approach is much cleaner, faster, and more robust. Mizhm's `vozer/` is designated as the primary base.

---

## 2. Repo Standards & Constraints Summary

| Rule / Requirement | Standard in Qsang_vbook | Action for quykhu |
| :--- | :--- | :--- |
| **Author** | Strictly `"MuseAi"` | Put attribution to mizhm in `description` |
| **Locale / Type** | `"locale": "vi_VN"`, `"type": "novel"` | Fix from `local: "vi-VN"` |
| **JS Engine Compatibility**| Rhino ES6 strictly: only `var`, functions. No `let`, `const`, arrows, async/await, template literals, `?.`, `??`, spread | Transpile/refactor all scripts to `var` and ES5-compatible JS |
| **Comments Restriction** | Rule 6.12 / 12: NO `load('...')` inside comments | Ensure no file has `load('...')` in comments |
| **Lifecycle Scripts** | `home.js`, `genre.js`, `detail.js`, `search.js`, `page.js`, `toc.js`, `chap.js`, `gen.js` | Rename `toc-page.js` -> `page.js` or map in manifest |
| **Static Home** | `home.js` must return static tabs without fetching | Refactor `home.js` to static category/rank tabs |
| **Rate Limiting** | Use `rateLimitDelay()` / backoff on 429 | Integrate `rateLimitDelay()` in `config.js` / request wrapper |
| **Error Handling** | Return `Response.error("Tiếng Việt...")`, never `null` | Replace all `Response.error("Failed to fetch data")` and `return null` with clear Vietnamese messages |
| **Lib Inlining** | Build tool inlines needed libraries (`crypto.js`) from `lib/` | Let `scripts/cli.js build` handle library inlining |
| **Fixtures** | Required `test.json` (golden fixture) & `health.json` (light probe) | Create valid fixtures tested against live site |

---

## 3. Directory Layout Planned

```
extensions/novel/quykhu/
├── icon.png          (copy from mizhm vozer or kychitoge)
├── plugin.json       (metadata, script map, config)
├── health.json       (light probe cases with pattern & Accept-Language)
├── test.json         (Golden fixtures for scripts)
├── README.md         (documentation & attribution)
└── src/
    ├── config.js
    ├── home.js
    ├── genre.js
    ├── detail.js
    ├── search.js
    ├── page.js
    ├── toc.js
    ├── chap.js
    └── gen.js
```
