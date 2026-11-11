# Request: Port vBook Extension QuyKhu (quykhu.com) to Qsang_vbook

- **Date**: 2026-11-11
- **Task**: Port extension QuyKhu (quykhu.com / vozer.io) into Qsang_vbook repo
- **Goal**: Create a fully compliant, high-quality novel extension for `quykhu.com` adhering to Qsang_vbook standards and AGENTS.md rules.
- **Target Repo**: `/home/antigravity/qsang2025/Qsang_vbook`
- **Working Branch**: `feature/quykhu-ag` (branched from `main` at `d8ac02f`)
- **Source Base**: Mizhm's `vozer/` (`/home/antigravity/qsang2025/vbook-extensions_mizhm/vozer/`), version 6. (Backup reference: kychitoge's `kychi_quykhu`).

---

## Definition of Done (DoD)
1. Extension located at `extensions/novel/quykhu/` in `Qsang_vbook`.
2. Complies 100% with `AGENTS.md` and `extension-api.md`:
   - `author`: strictly `"MuseAi"` (no `(ref: ...)`).
   - `locale`: `"vi_VN"`, `type`: `"novel"`, `encrypt: false`.
   - Script map contains complete lifecycle: `home.js`, `genre.js`, `detail.js`, `search.js`, `page.js` (or `toc-page.js`), `toc.js`, `chap.js`, plus `gen.js`.
   - Strict Rhino ES6 syntax (no `const`, `let`, `() => {}`, async/await, template literals, `?.`, `??`, spread).
   - Zero `load('...')` inside comments across all `.js` files.
   - Paced requests using `rateLimitDelay()` / `request()` with required headers (`Accept-Language: vi-VN,vi;q=0.9`).
   - Clean error responses with `Response.error("...")` in Vietnamese. Never return `null`.
3. Test and Health Fixtures:
   - `test.json` containing valid test cases for scripts.
   - `health.json` containing probe cases for CI health checks.
4. Validation and Packaging:
   - Passes `node scripts/cli.js validate` with 0 errors.
   - Registry updated via `node scripts/cli.js build-catalog`.
   - Packaged cleanly into `extensions/novel/quykhu/plugin.zip`.

---

## Prohibitions & Anti-patterns
- NEVER switch to or touch branch `feature/quykhu` or merge to `main`.
- NEVER use modern ES6+ features not supported by Rhino (arrows, `let`/`const`, template strings, async/await, `?.`, `??`, spread).
- NEVER place `load('...')` inside code comments.
- NEVER put `(ref: ...)` in the `author` field.
- NEVER rotate User-Agent arbitrarily when bypassing WAF/Cloudflare rules.
- NEVER return `null` on errors.
