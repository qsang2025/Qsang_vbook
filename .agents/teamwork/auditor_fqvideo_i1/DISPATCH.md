# DISPATCH

## 2026-11-20T03:05:30Z

From: `7f5108737b85ec56635b6d6c8eaeb39b` (Project Orchestrator)

You are `auditor_fqvideo_i1` (Forensic Integrity Auditor — Whole-Project Audit, Iteration 1), dispatched by Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`).

## Workspace & Paths
- Working directory: `/home/antigravity/qsang2025/Qsang_vbook`
- Your state folder: `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/auditor_fqvideo_i1`
- Original request file (READ THIS FIRST, verbatim): `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/ORIGINAL_REQUEST.md`
  - Scope is strictly `## Follow-up — 2026-11-20T02:11:43Z` (FQ Video task).
- Project spec & contracts: `/home/antigravity/qsang2025/Qsang_vbook/PROJECT.md`
- Worker handoff to audit (audit all commands and claims independently — NEVER trust claims/logs): `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/worker_fqvideo_i1/handoff.md`

## Wave Verification Rules (MANDATORY)
1. **Strictly READ-ONLY working tree**: MUST NOT modify any tracked or repo files, and MUST NOT put source, probes/tests, or data in `.agents/teamwork/` (metadata in your `.agents/teamwork/auditor_fqvideo_i1/` folder only). Stage any ad-hoc scratch probes in a dedicated per-probe temp dir (`mktemp -d -- "${TMPDIR:-/tmp}/teamwork_probe.XXXXXX"` with `chmod 700`), never copying source trees or editing Worker-owned files, and remove ONLY that probe dir before reporting.
2. **Audit Scope — Whole-Project Audit**: Audit ALL artifacts produced for this task across the whole repository diff (`git diff main..HEAD`, `git status`, all files in `extensions/video/fqvideo/**`, `extensions/video/fqvideo/plugin.zip`, regenerated root `plugin.json`). Run target-scoped verification checks (do NOT run repo-wide `validate.js` concurrently with Reviewer 1 — run `node --check extensions/video/fqvideo/src/*.js`, zip extraction + byte parity, MD5 `lib/` parity, static forensics, and independent live spot-check).
3. Timestamp active checks in `progress.md` and record exact UTC start/end timestamps in `handoff.md`.

## Forensic Integrity Checks (Run EVERY Check Systematically)
1. **Full Git Diff & Provenance Audit**:
   - Inspect `git branch`, `git rev-parse main HEAD`, `git show --stat 248344f`, and `git diff main..HEAD` across every added/modified file.
   - Verify NO `main` modification, NO accidental staging of `PROJECT.md` or `.agents/teamwork/`, NO hidden files or extra `.zip` files.
   - Verify clean-room MIT provenance: confirm zero copied GPL-3.0 code from `duongden/vbook`, zero `encrypt: true` ciphertext, zero `vbook.trasua.workers.dev` asset copying (`icon.png` validity & non-placeholder), zero hardcoded secrets/tokens/cookies/passwords.
2. **Anti-Cheating / Authentic Implementation Audit**:
   - Inspect EVERY file in `extensions/video/fqvideo/src/*.js`, `plugin.json`, `test.json`, `health.json`, and `README.md` for:
     - Hardcoded test outputs, mock/stub/facade functions returning canned results, or special-case branching on `test.json` IDs (`7706512650816982040`, `7708355462780947518`, `7705824595416190014`, etc.).
     - SEO 10-second preview cheating (`/video/public/.../360p.mp4`) or `type: "auto"` disguise instead of genuine `type: "native"` direct MP4 resolution.
     - Fake/bypassed Rhino ES6 compliance, `load('...')` inside comments (Rule 12), recursive `load()`, or tampered `src/{config-helpers,fetch-helpers,rate-limit}.js` vs root `lib/` MD5s.
     - Tampered `plugin.zip` (verify exact byte-for-byte parity between every entry inflated from `plugin.zip` and files on disk).
     - Fabricated `VBOOK_SERVER` / device test claims (verify `README.md`, `test.json`, and Worker handoff honestly state `VBOOK_SERVER` is unreachable in VM, and independently verify `127.0.0.1:18080` is unreachable).
3. **Independent Target-Scoped Runtime & Live Verification**:
   - Run `node --check extensions/video/fqvideo/src/*.js`.
   - Independently execute `extensions/video/fqvideo/src/chap.js` and `src/track.js` (inflated from `plugin.zip`) in a clean temp `/tmp` harness against at least ONE live Short Drama episode AND ONE live Comic-Drama episode (paced ≥2.5s), verify real `qznovelvod.com` HTTP 206 `video/mp4` bytes with duration > 60s (NOT 10s!), AND verify Ep 6 returns honest Vietnamese `Response.error`. Clean up `/tmp` dir afterwards!
4. **Verdict (BINARY)**:
   - Report explicit **`CLEAN`** OR **`INTEGRITY VIOLATION`** with complete forensic evidence chain (any single violation = **`INTEGRITY VIOLATION`**).

Write complete `handoff.md` to `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/auditor_fqvideo_i1/handoff.md` and send a concise message via `send_message` to `7f5108737b85ec56635b6d6c8eaeb39b`.
