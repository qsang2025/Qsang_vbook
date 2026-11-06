# BRIEFING — 2026-11-06T15:35:00Z

## Mission
Investigate candidate video sources for Chinese AI Animation (Hoạt hình AI Trung Quốc / short drama / AI comic-video) that provide real playable `.m3u8` / `.mp4` streams or working embeds (`type: "native"` or `type: "auto"`).

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, synthesizer
- Working directory: /home/antigravity/.agents/teamwork/explorer_r1_3
- Original parent: 25e36c71a9befc3c4b80d7fe166fc4dc
- Milestone: M1: Build, Verify & Push 2 Video Extensions

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Conserve tokens: be direct, concise, and focused
- Avoid sites that rely exclusively on `streamfree.vip`

## Current Parent
- Conversation ID: 25e36c71a9befc3c4b80d7fe166fc4dc
- Updated: 2026-11-06T15:35:00Z

## Investigation State
- **Explored paths**:
  - Existing video extensions across `/home/antigravity/qsang2025/*` (`shortmax`, `allshorts`, `yanhh3d`, `hhtqvietsub`, `gamomephim`, `bilibili`, `kychi_*`)
  - `https://hh3dhay.cam` (`/hoat-hinh-2d`, `/hoat-hinh-3d`, `/hoat-hinh-4k`, `/search?keysearch=...`, episode player `startStreaming`)
  - `https://www.shorttv.live/vi` (ShortMax: `/vi/dramas/...`, `/vi/drama/...`, `/vi/episode/...`, and `https://shortweb.shorttv.live/app-api/app`)
  - `https://phimapi.com` (KKPhim API v1: `/v1/api/the-loai/phim-ngan?country=trung-quoc`, `/v1/api/the-loai/hoat-hinh?country=trung-quoc`, `/phim/<slug>`)
  - `https://api.dailymotion.com/videos` + `https://www.dailymotion.com/player/metadata/video/<id>`
- **Key findings**:
  1. **Candidate 1 — `hh3dhay.cam` (HH3DHay — Hoạt Hình 2D / 3D / Tu Tiên Trung Quốc)**: Dedicated `/hoat-hinh-2d` (2D/motion-comic donghua like *Đại Vương Tha Mạng*, *Nhất Niệm Vĩnh Hằng*, *Người Trên Vạn Người*, *Lưỡng Bất Nghi*) + `/hoat-hinh-3d`. Episode pages contain `startStreaming()` with `LINK1` (`play-fb-v8/play/<id>` -> resolves to direct `fbcdn.net/*.mp4` 720p H.264 progressive stream) and `LINK2`/`LINK3`/`LINK4` (`streamrpt1.site/.../*.m3u8` -> `data-obf` base64 JSON `.pU` -> unencrypted `#EXTM3U` VOD HLS playlist).
  2. **Candidate 2 — `www.shorttv.live/vi` (ShortMax — Phim Ngắn & Tu Tiên / AI Comic-Drama Lồng Tiếng)**: Hosts Chinese Tu Tiên / Huyền Huyễn / Kỳ Ảo short dramas & AI comic-dramas dubbed in Vietnamese (e.g. *[Lồng tiếng] Luyện Khí 3000 Tầng: Mở Ván Nhận Nữ Đế Làm Đồ Đệ*, *[Lồng tiếng] Ma Tôn Tối Cao*). Episode SSR HTML directly contains unencrypted `#EXTM3U` HLS URLs (`https://akamai-static.shorttv.live/hls-encrypted/<hash>_720/main.m3u8?auth_key=...`). API uses AES-CBC (`key=iv="shortwebapiaesen"`).
  3. **Candidate 3 — `phimapi.com` (KKPhim JSON API — Phim Ngắn & Hoạt Hình Trung Quốc)**: Zero-scraping JSON API (`/v1/api/the-loai/phim-ngan?country=trung-quoc` and `/v1/api/the-loai/hoat-hinh?country=trung-quoc`) returning direct `link_m3u8` (`https://a.kvp726.com/.../index.m3u8`).
  4. **Candidate 4 — Dailymotion Public JSON API (`api.dailymotion.com`)**: Curated search/channels for `truyện tranh động thuyết minh` / `hoạt hình AI trung quốc` / `hoạt hình 2D trung quốc`; `/player/metadata/video/<id>` returns direct native HLS `.m3u8` (`https://cdndirector.dailymotion.com/cdn/manifest/video/<id>.m3u8?sec=...`).
- **Unexplored areas**: None required.

## Key Decisions Made
- Recommend `hh3dhay.cam`, `shorttv.live`, `phimapi.com`, and `dailymotion.com` with complete endpoint & stream extraction specs so the orchestrator can pick any pair without overlap with the 3D extension.

## Artifact Index
- `/home/antigravity/.agents/teamwork/explorer_r1_3/BRIEFING.md` — Working memory
- `/home/antigravity/.agents/teamwork/explorer_r1_3/progress.md` — Liveness heartbeat
- `/home/antigravity/.agents/teamwork/explorer_r1_3/handoff.md` — 5-component handoff report
