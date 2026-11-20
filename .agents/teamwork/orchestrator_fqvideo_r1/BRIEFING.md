# BRIEFING — 2026-11-20T02:13:30Z

## Mission
Build vBook video extension **FQ Video** (`fanqienovel.com`: short dramas + animation, direct API, native playback) in `/home/antigravity/qsang2025/Qsang_vbook` on a new git branch (do NOT merge into `main`), passing `vbook-extensions` validation/testing and reporting subagent models, measured phase/step UTC timings, validate results, and honest device test status.

## 🔒 My Identity
- Archetype: Project Orchestrator (top-level)
- Level: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: `/home/antigravity/qsang2025/Qsang_vbook`
- State folder: `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/orchestrator_fqvideo_r1`
- Original parent: Project Sentinel (`sentinel_fqvideo_1`)
- Original parent conversation ID: `18b3615595e6264126412eb98130aae7`
- Scope: Strictly the `2026-11-20T02:11:43Z` FQ Video task in `ORIGINAL_REQUEST.md` (NOT the archived `2026-11-06` task).

## 🔒 My Workflow
- **Pattern**: Project Pattern (Survey → Assess → Decompose/Delegate or Iteration Loop → Gate → Report)
- **Scope document**: `/home/antigravity/qsang2025/Qsang_vbook/PROJECT.md` (to be created after Step 0 Survey)
1. **Survey (Step 0)**: Spawn 3 parallel Explorers / Spec Miners (`spec_miner_fqvideo_repo_1`, `explorer_fqvideo_forks_1`, `spec_miner_fqvideo_api_1`) to map repo specs/template, vBook forks/license, and live Fanqie video APIs/streams. Merge into `PROJECT.md § Feature Inventory`.
2. **Assess (Step 1) & Dispatch (Step 2A or 2B)**:
   - Decide whether scope fits a single Iteration Loop (2B) or requires Decompose & Delegate (2A, plus Dual Track E2E Testing Track if 2A).
   - Iteration loop: 3 Explorers (or Survey reports on top-level iter 1 if complete) → 1 Worker → parallel verification wave (2 Reviewers + 2 Challengers + 1 Forensic Auditor) → strict AND Gate (Auditor BINARY VETO evaluated first).
3. **On failure** (in this order): Retry → Replace → Skip (NEVER skip Auditor) → Redistribute → Redesign → Escalate (Project Orchestrator has no technical escalation — must redesign).
4. **Succession**: Self-succeed at 20 spawns (once non-orchestrator subagents complete); write soft `handoff.md`, cancel crons, spawn successor with parent `18b3615595e6264126412eb98130aae7`.
- **Work items**:
  1. Step 0: Parallel Survey (3 agents) [done]
  2. Step 1: Assess & Create `PROJECT.md` [done — single-cycle 2B]
  3. Step 2B: Iteration 1 — Worker → Parallel Verification Wave (2 Reviewers + 2 Challengers + 1 Forensic Auditor) → Gate [in-progress]
  4. Final Synthesis & Report to Sentinel [pending]
- **Current phase**: 2 (Step 2B — Iteration 1 Implementation)
- **Current focus**: Worker 1 (`worker_fqvideo_i1`) implementing clean-room `extensions/video/fqvideo` on branch `feature/fqvideo`.

## 🔒 Key Constraints
- DISPATCH-ONLY orchestrator: NEVER write/modify source code, NEVER run build/test commands, NEVER explore code directly.
- NEVER reuse a subagent after it delivers its handoff — always spawn fresh.
- Always pass `ORIGINAL_REQUEST.md` path verbatim in every subagent dispatch.
- Always use `Model: "inherit"` for all subagent invocations (user explicitly opted into `/teamwork` multi-agent orchestration, not `quota-workflow` Flash).
- Work strictly on a **new git branch** in `Qsang_vbook` (do NOT merge into `main`).
- Follow `Qsang_vbook/AGENTS.md` (MIT license — no GPL-3.0 code copy from `duongden/vbook`; `author: "MuseAi"`; Rhino ES6; `load()` comment rule; `scripts/cli.js` for validate/build/catalog; pacing anti-rate-limit).
- Measure and record exact UTC start/end timestamps and elapsed durations for every phase and subagent in `TIMING_LOG.md`.
- Forensic Auditor INTEGRITY VIOLATION is a non-negotiable BINARY VETO.

## Current Parent
- Conversation ID: `18b3615595e6264126412eb98130aae7`
- Updated: `2026-11-20T02:48:05Z`

## Key Decisions Made
- Dispatched 3 parallel Survey subagents (`teamwork_preview_spec_miner` × 2 + `teamwork_preview_explorer` × 1) using `Model: "inherit"` with distinct `*_fqvideo_*` state folders.
- **Fork decision**: DO NOT PORT — BUILD NEW clean-room (`duongden/vbook` is the only fork with `FQ Video`, blocked by GPL-3.0 + `"encrypt": true`).
- **API decision**: Build on official ByteDance Fanqie/Hongguo public web direct API (`hongguoduanju.com` + `fanqienovel.com/api/reader/directory/detail`), pure Rhino ES6, verified live unencrypted `type: "native"` MP4 streams (`er=0`) for short drama + comic-drama + AI-drama; honestly flag Ep 6+ as `lock: true` with clear Vietnamese error (mobile app APIs require proprietary `X-Argus`/`X-Ladon` signing + `spade_a` CENC DRM).
- **Scoping decision**: Step 1 → Yes (single-cycle Step 2B, skipping duplicate Iteration 1 Explorers per Step 2B **a** since all 3 Survey reports already provide full file/line/API specs).

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| `spec_miner_fqvideo_repo_1` | `teamwork_preview_spec_miner` | Survey: repo rules, vbook-extensions skill, hhtqvietsub template, CLI/validate | completed | `7382030e92244b575684fe53420ce3bb` |
| `explorer_fqvideo_forks_1` | `teamwork_preview_explorer` | Survey: vBook forks & FQ Video base check + license check | completed | `a1ba902eed4129cf7c8a551b60e577b6` |
| `spec_miner_fqvideo_api_1` | `teamwork_preview_spec_miner` | Survey: live Fanqie video APIs (short drama + animation) & native stream probe | completed | `a71a082c38b0bcec6a848d9180afec37` |
| `worker_fqvideo_i1` | `teamwork_preview_worker` | Iter 1: implement `extensions/video/fqvideo` on `feature/fqvideo`, build, catalog, validate, live E2E harness | completed | `d289d8c51ba8a154d2007a9cb4094c2e` |
| `reviewer_fqvideo_i1_1` | `teamwork_preview_reviewer` | Iter 1 Wave: Primary Reviewer (full-suite validate + catalog + architecture/spec review) | in-progress | `5ebbb3ce4be7b58ac45bb5534398390a` |
| `reviewer_fqvideo_i1_2` | `teamwork_preview_reviewer` | Iter 1 Wave: Secondary Reviewer (target-scoped Rhino ES6 + config/load/edge-case audit) | in-progress | `7afc9b196c7f22ceb399b8695a7d04cc` |
| `challenger_fqvideo_i1_1` | `teamwork_preview_challenger` | Iter 1 Wave: Challenger 1 (live dynamic E2E + MP4 Range probes + test.json/health.json) | in-progress | `a7abb0355ca337563285a61ff540a3fb` |
| `challenger_fqvideo_i1_2` | `teamwork_preview_challenger` | Iter 1 Wave: Challenger 2 (zip-runtime harness + fault injection + edge-case torture tests) | in-progress | `28ea09843ff122317c8a9582a690fcb0` |
| `auditor_fqvideo_i1` | `teamwork_preview_auditor` | Iter 1 Wave: Whole-project Forensic Integrity Auditor | in-progress | `e494e0a94212cd3d9838848098b92313` |

## Succession Status
- Succession required: no
- Spawn count: 9 / 20
- Pending subagents: `5ebbb3ce4be7b58ac45bb5534398390a`, `7afc9b196c7f22ceb399b8695a7d04cc`, `a7abb0355ca337563285a61ff540a3fb`, `28ea09843ff122317c8a9582a690fcb0`, `e494e0a94212cd3d9838848098b92313`
- Predecessor: none
- Successor spawned: not yet spawned
- Successor generation: none
- Successor state folder: none

## Active Timers
- Heartbeat cron: `7f5108737b85ec56635b6d6c8eaeb39b/task-71` (`*/20 * * * *`)
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: handle timers as step 4 of State Recovery says

## Artifact Index
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/ORIGINAL_REQUEST.md` — Immutable user request (`2026-11-20T02:11:43Z` active section)
- `/home/antigravity/qsang2025/Qsang_vbook/PROJECT.md` — Architecture, Feature Inventory (#1–#15), Milestone M1, Interface Contracts, Code Layout
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/spec_miner_fqvideo_repo_1/handoff.md` — Repo/skill/validate/Flash timing survey
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/explorer_fqvideo_forks_1/handoff.md` — vBook forks & license survey
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/spec_miner_fqvideo_api_1/handoff.md` — Live Fanqie/Hongguo video API & stream protocol survey
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/worker_fqvideo_i1/handoff.md` — Iter 1 Worker report (commit `248344f` on `feature/fqvideo`)
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/orchestrator_fqvideo_r1/GATE_STATUS.md` — Iteration gate ledger
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/orchestrator_fqvideo_r1/DISPATCH.md` — Sentinel dispatch log
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/orchestrator_fqvideo_r1/BRIEFING.md` — Working memory
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/orchestrator_fqvideo_r1/progress.md` — Liveness heartbeat & iteration tracker
- `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/orchestrator_fqvideo_r1/TIMING_LOG.md` — Measured UTC timings & subagent model log
