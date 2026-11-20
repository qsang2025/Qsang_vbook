# BRIEFING — 2026-11-20T02:41:25Z

## Mission
Empirically probe and document live Fanqie Video APIs (short drama / 短剧 + animation / 动漫 / 漫剧) and native video stream playback protocols for building the vBook `FQ Video` extension (`type: "video"`). **STATUS: COMPLETED.**

## 🔒 My Identity
- Archetype: Specification Miner (`spec_miner_fqvideo_api_1`)
- Roles: Spec Miner — Live Fanqie Video API & Stream Protocol (READ-ONLY)
- Working directory: `/home/antigravity/qsang2025/Qsang_vbook`
- State folder: `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/spec_miner_fqvideo_api_1`
- Original parent: `7f5108737b85ec56635b6d6c8eaeb39b`
- Milestone: FQ Video live API & stream protocol specification

## 🔒 Key Constraints
- READ-ONLY on all repo files; write ONLY to state folder `.agents/teamwork/spec_miner_fqvideo_api_1/`.
- Strict pacing: 1 HTTP request at a time per host, >= 2 seconds delay (`sleep 2`), no parallel bursts, consistent browser-like User-Agent (never rotate UA across retries).
- Never log secrets/tokens/cookies from disk.
- Clean up any scratch directory before handoff.
- Record exact UTC start (`2026-11-20T02:16:06Z`) and end (`2026-11-20T02:41:25Z`) times.
- Scope strictly follows `ORIGINAL_REQUEST.md` `## Follow-up — 2026-11-20T02:11:43Z`.

## Current Parent
- Conversation ID: `7f5108737b85ec56635b6d6c8eaeb39b`
- Updated: 2026-11-20T02:41:25Z

## Task Summary
- **What to build**: Technical API specification only (NO implementation) for vBook `FQ Video` extension (`https://fanqienovel.com` / `https://hongguoduanju.com`, `type: "video"`, short drama + animation, direct API, native playback).
- **Success criteria**: Verified live direct APIs for home/lists (short drama + animation), genre/categories, search, detail, toc, chap + track (native stream URLs verified via HTTP Range `bytes=0-1023`/`0-65535`), Rhino ES6 feasibility check, and VM `VBOOK_SERVER` status check.
- **Interface contracts**: `/home/antigravity/qsang2025/Qsang_vbook/extension-api.md`
- **Code layout**: Read-only survey; reference video template at `extensions/video/hhtqvietsub`.

## Key Decisions Made
- UTC start: `2026-11-20T02:16:06Z`; UTC end: `2026-11-20T02:41:25Z` (`25m 19s`).
- Verified two-surface ByteDance video split:
  1. `hongguoduanju.com` + `fanqienovel.com/api/reader/directory/detail`: 100% unsigned, pure Rhino ES6, full-length unencrypted MP4 (`er=0`) via `play-info` (`legacy_play_info`, 720p for comic/AI drama) and `fallback-play-info` (for both short drama & comic drama), `Referer: https://hongguoduanju.com/` required — **BUT hard-capped at first 5 episodes (`accessible_episode_cnt: 5`; Ep 6+ return HTTP 403)**.
  2. `api5-normal-sinfonline*.fqnovel.com` mobile app API: `device_register` works plain JSON (without `tt_data=a`), but all content/video endpoints silently return `HTTP 200 / 0 B` unless signed with ByteDance's proprietary `X-Argus`+`X-Ladon` / `X-Medusa`+`X-Helios`, and return CENC `spade_a` streams.
- Scratch directory deleted and verified absent; repo remains strictly read-only.

## Artifact Index
- `.agents/teamwork/spec_miner_fqvideo_api_1/DISPATCH.md` — Dispatch instructions
- `.agents/teamwork/spec_miner_fqvideo_api_1/progress.md` — Liveness heartbeat & completion log
- `.agents/teamwork/spec_miner_fqvideo_api_1/handoff.md` — Complete 5-component live API & stream protocol specification
