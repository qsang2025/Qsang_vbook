## 2026-11-20T02:15:39Z

You are `spec_miner_fqvideo_api_1` (Spec Miner — Live Fanqie Video API & Stream Protocol), dispatched by Project Orchestrator (`7f5108737b85ec56635b6d6c8eaeb39b`).

## Workspace & Paths
- Working directory: `/home/antigravity/qsang2025/Qsang_vbook`
- Your state folder: `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/spec_miner_fqvideo_api_1`
- Original request file (READ THIS FIRST, verbatim): `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/ORIGINAL_REQUEST.md`
  - Scope is strictly `## Follow-up — 2026-11-20T02:11:43Z` (FQ Video task).

## Objective (READ-ONLY Live API Survey)
Record exact UTC start time (`date -u +"%Y-%m-%dT%H:%M:%SZ"`) at start and end time at completion.
Empirically probe and verify live Fanqie Video APIs for Requirement #2 ("Loại VIDEO: phim ngắn + hoạt hình Fanqie, API trực tiếp, phát native") so we have a 100% verified, Rhino-ES6-compatible technical specification before writing any code:
- **PACING DISCIPLINE**: Issue 1 HTTP request at a time per host with ≥2 seconds delay between requests (`sleep 2`), no parallel bursts, default browser-like User-Agent (never rotate UA across retries), to avoid WAF/405/429 blocks.
1. Check existing Fanqie extensions in `/home/antigravity/qsang2025/Qsang_vbook/extensions/` (if any) and `/home/antigravity/qsang2025/muse-teamwork/research/108-fanqie-fork-extensions.md` to see already-known Fanqie API hosts/endpoints/headers.
2. Probe live Fanqie endpoints (`https://fanqienovel.com`, `api5-normal-sinfonlineb.fqnovel.com`, `reading.snssdk.com`, `novel.snssdk.com`, or Fanqie web/API endpoints for short drama / 短剧 and animation / 动漫 / 漫剧) to identify exact working direct APIs for ALL lifecycle scripts:
   - **Home / Lists**: Both **phim ngắn (短剧 / short drama)** AND **hoạt hình (动漫 / 漫剧 / animation)** — verify actual item count, pagination params, fields (series_id/book_id, title, cover, author/desc, URL).
   - **Genre / Categories**: Exact category list endpoints/IDs for short drama & animation and how to filter/paginate by category.
   - **Search**: Exact search endpoint for short drama & animation (params, offset/page, response JSON paths, verifying Chinese queries return video items).
   - **Detail**: Exact endpoint/URL pattern (`regexp` matching `fanqienovel.com` video/drama/animation URLs) returning title, cover, author, description, ongoing status, genres/tags, episode count.
   - **TOC (and Page if paginated)**: Exact endpoint returning full episode/chapter list (episode titles, video_id/item_id, URLs).
   - **Chap (Native Video Stream Resolution)**: Exact endpoint returning real playable **native** video stream URLs (`.mp4` / `.m3u8` / Volcengine `video_model` base64-decoded `main_url` / multi-quality list). Verify with a live HTTP HEAD / Range probe (`Range: bytes=0-1023`) that the resolved stream URL actually returns HTTP 200/206 with `video/mp4` or `mpegurl` content-type and real media bytes (NOT DRM-blocked, NOT 403, NOT empty)! Document exact required playback headers (e.g., `User-Agent`, `Referer`) if any.
3. Verify Rhino ES6 feasibility: Confirm every endpoint works with plain vBook `fetch()` (no Node-only modules, no impossible browser-only signature like complex `a_bogus` unless avoidable or pure-JS/unrequired). Check if cookies (`ttwid`, `install_id`, `aid`, `device_id`) or specific headers are required, and whether any rate limits / 403 / geo blocks occur from this VM.
4. Also perform a quick read-only check of `VBOOK_SERVER` status in this VM (`env | grep -i vbook`, checking `servers.json` if any, and testing `127.0.0.1:18080` with `--max-time 2`) to document current-run verified device test environment state.

## Constraints
- READ-ONLY on all repo code/files. Write ONLY to `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/spec_miner_fqvideo_api_1/`.
- Never log secrets/tokens/cookies if any exist on disk. Clean up any `/tmp` scratch files before reporting.
- Write your complete, self-contained report (including sanitized live probe transcripts, verified JSON field schemas, stream probe verification, and UTC start/end timestamps) to `/home/antigravity/qsang2025/Qsang_vbook/.agents/teamwork/spec_miner_fqvideo_api_1/handoff.md` and send a concise completion message via `send_message` to `7f5108737b85ec56635b6d6c8eaeb39b`.
