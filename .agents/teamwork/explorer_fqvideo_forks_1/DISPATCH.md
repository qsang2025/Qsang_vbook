## 2026-11-20T02:15:39Z

Sender: `7f5108737b85ec56635b6d6c8eaeb39b` (Project Orchestrator)

You are `explorer_fqvideo_forks_1` (Explorer — vBook Forks & FQ Video Reference), dispatched by Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`).

## Workspace & Paths
- Working directory: `/home/antigravity/qsang2025/Qsang_vbook`
- Your state folder: `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/explorer_fqvideo_forks_1`
- Original request file (READ THIS FIRST, verbatim): `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/ORIGINAL_REQUEST.md`
  - Scope is strictly `## Follow-up — 2026-11-20T02:11:43Z` (FQ Video task).

## Objective (READ-ONLY Survey)
Record exact UTC start time (`date -u +"%Y-%m-%dT%H:%M:%SZ"`) at start and end time at completion.
Thoroughly investigate Requirement #1 ("Kiểm tra các fork vBook đã có base FQ Video/fanqienovel chưa. Có thì port theo quy tắc nhà; chưa có thì build mới theo mẫu extension video HHTQ Vietsub (task 113)") and Requirement #2 ("Trên điện thoại Anh đã có sẵn nguồn FQ Video — dùng làm mẫu đối chiếu"):
1. Read `/home/antigravity/qsang2025/muse-teamwork/research/108-fanqie-fork-extensions.md` and search `/home/antigravity/qsang2025/muse-teamwork/` for any Fanqie/FQ Video/vBook fork research.
2. Inspect any existing Fanqie/FQ extensions in `/home/antigravity/qsang2025/Qsang_vbook/extensions/` and `/home/antigravity/qsang2025/vbook-extensions_Darkrai9x/` (to see existing Fanqie patterns, endpoints, mirrors, or video extensions).
3. Use `gh` CLI (authenticated as `qsang2025`) to search GitHub vBook forks/repos for `FQ Video`, `fqvideo`, `fanqie`, `fanqienovel`, `duongden/vbook`, `vbook.trasua`, `sonzin`, `DatTran`, `mizhm`, `nhocconsr`, `hoangmanh`, etc.
4. For every candidate fork/repo found:
   - Document repo URL, license (CRITICAL: `Qsang_vbook` is MIT; `duongden/vbook` is GPL-3.0 — NEVER copy GPL-3.0 code into `Qsang_vbook`!), whether source code exists or only external/encrypted zip, and exact `plugin.json` metadata / features (name, source URL, regexp, description, type, locale, version, scripts) of `FQ Video` if publicly inspectable (e.g., checking catalog JSON or publicly accessible `plugin.json` metadata in a temporary `/tmp` dir that you delete before reporting).
   - IMPORTANT: If an external zip like `vbook.trasua.workers.dev` is publicly listed in `duongden/vbook`'s catalog, check whether it is encrypted/obfuscated or what its `plugin.json` / user-facing feature surface (home tabs, genres, URL patterns, video domains/APIs) looks like ONLY for behavioral comparison ("mẫu đối chiếu") — do NOT copy any GPL-3.0 or proprietary/unlicensed source code into the repo, and delete any temp `/tmp` files immediately!
5. Give a clear, evidence-backed recommendation: PORT (only if MIT/compatible readable source exists) vs BUILD NEW clean-room following `extensions/video/hhtqvietsub` template & `AGENTS.md`, plus a clear feature comparison table against the reference FQ Video plugin.

## Constraints
- READ-ONLY on all repo code/files. Write ONLY to `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/explorer_fqvideo_forks_1/`.
- Clean up any temporary `/tmp` scratch directories before reporting.
- Write your complete, self-contained report to `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/explorer_fqvideo_forks_1/handoff.md` (with UTC start/end timestamps) and send a concise completion message via `send_message` to `7f5108737b85ec56635b6d6c8eaeb39b`.
