## 2026-11-20T03:05:29Z

From: Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`)
To: `challenger_fqvideo_i1_1` (Challenger 1 — Live Independent E2E & Native Stream Empirical Verifier, Iteration 1)

## Workspace & Paths
- Working directory: `/home/antigravity/qsang2025/Qsang_vbook`
- Your state folder: `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/challenger_fqvideo_i1_1`
- Original request file (READ THIS FIRST, verbatim): `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/ORIGINAL_REQUEST.md`
  - Scope is strictly `## Follow-up — 2026-11-20T02:11:43Z` (FQ Video task).
- Project spec & contracts: `/home/antigravity/qsang2025/Qsang_vbook/PROJECT.md`
- Worker handoff to challenge (do NOT trust claims/logs — verify empirically from scratch): `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/worker_fqvideo_i1/handoff.md`

## Wave Verification Rules (MANDATORY)
1. **Strictly READ-ONLY working tree**: MUST NOT modify any tracked or repo files, and MUST NOT put source, probes/tests, or data in `.agents/teamwork/` (metadata in your `.agents/teamwork/challenger_fqvideo_i1_1/` folder only). Stage your isolated adversarial probe harness in a dedicated per-probe temp dir created with `mktemp -d -- "${TMPDIR:-/tmp}/teamwork_probe.XXXXXX"` (`chmod 700`), never copying source trees or editing Worker-owned files, and **remove ONLY that probe dir before reporting**.
2. **Pacing & Isolation**: Do NOT run full-repo `validate.js` (owned by Reviewer 1). Pace ALL live HTTP requests ≥2.5 seconds apart per host (1 request at a time, no parallel bursts) so we don't trigger WAF/405/429 while peer verifiers run!
3. Timestamp active runs in `progress.md` and record exact UTC start/end timestamps in `handoff.md`.

## Empirical Challenge Mission
Build an independent vBook runtime emulator in your temp dir (simulating vBook's `ScriptExecutor`: raw text `load()` from `src/` — and ALSO test loading scripts inflated directly from `extensions/video/fqvideo/plugin.zip`! — injected `const` string config variables from `plugin.json`, strict `User-Agent` audit confirming scripts never inject custom `User-Agent`, `Response.success`/`Response.error`, `localStorage`, synchronous `sleep`, `fetch`) and try to BREAK the extension on LIVE data:
1. **Dynamic Discovery Chain (NO hardcoded sample IDs only!)**:
   - Run `home.js` (verify 0 HTTP calls) → pick live tabs for **Short Drama**, **Comic-Drama**, and **AI-Drama** → run `search.js` on those tabs (including pagination to page 2) → dynamically pick **fresh live items** NOT listed in `test.json`!
   - Run `genre.js` (verify 0 HTTP calls) → test at least one live sub-genre path from `real-drama`, `comic-drama`, and `ai-drama` via `search.js`.
   - Run `search.js` keyword queries (e.g. fresh Chinese drama/animation keywords, pagination page 1 → page 2, verify distinct items and valid string `next` tokens).
2. **Full Detail → TOC → Chap → Track → Live Media Playback Chain**:
   - For at least 1 fresh Live-Action Short Drama, 1 fresh Comic-Drama (漫剧), and 1 fresh AI-Drama (AI剧):
     - Run `detail.js` (verify `type === "video"`, valid `format`, non-empty `name`/`cover`/`url`, valid `genres` objects `{title, input, script}`).
     - Run `toc.js` (verify episode list, Ep 1..5 `lock === false`, Ep 6+ `lock === true`).
     - Run `chap.js` on Ep 1 (verify non-empty array of `{title, data}` with unique non-empty titles) → feed EVERY returned track's `data` into `track.js`.
     - Verify `track.js` returns `type === "native"`, `mimeType === "video/mp4"`, valid `http(s)` URL (NOT `/video/public/.../360p.mp4`), `host` equals stream origin, `headers.Referer` set appropriately, `timeSkip` is array.
     - Execute a **live HTTP Range probe** (`Range: bytes=0-65535`) on the resolved stream URL using the exact `headers` returned by `track.js`: confirm `HTTP 206`, `content-type: video/mp4`, valid MP4 boxes (`ftyp`, `moov`, `mvhd`, NO `encv` CENC encryption!), and real full duration (`> 30s`, NOT 10.000s SEO preview!).
   - Also test Ep 6 (`toc` item #6) through `chap.js` → `track.js`: verify clean Vietnamese `Response.error(...)` (no crash, no null return, no 10s preview fallback!).
3. **Execute `test.json` & `health.json` Live**:
   - Verify EVERY case in `extensions/video/fqvideo/test.json` passes its `expect` assertions when run through your independent emulator!
   - Verify EVERY case in `extensions/video/fqvideo/health.json` returns HTTP 200 and matches its `pattern` regex.
4. **Verdict**: Report explicit empirical verdict (**`APPROVE`** / **`CONFIRM`** vs **`FAIL`** / **`REQUEST_CHANGES`**) with exact command outputs, tested dynamic IDs, and a `## Unchallenged Areas` section if anything could not be exercised (e.g. real Android ExoPlayer via `VBOOK_SERVER`).

Clean up your `/tmp` probe dir, write `handoff.md` to `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/challenger_fqvideo_i1_1/handoff.md`, and send a concise message via `send_message` to `7f5108737b85ec56635b6d6c8eaeb39b`.
