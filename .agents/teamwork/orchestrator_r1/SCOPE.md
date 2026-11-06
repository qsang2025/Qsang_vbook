# Scope: Chinese 3D & AI Animation vBook Video Extensions

## Architecture
- Target repositories:
  - `/home/antigravity/qsang2025/Qsang_vbook` (`https://github.com/qsang2025/Qsang_vbook`)
  - `/home/antigravity/qsang2025/Qsang_vbook_pro` (`https://github.com/qsang2025/Qsang_vbook_pro`)
- Extension format: vBook video extension (`type: "video"`, `plugin.json` + `src/` scripts: `home.js`, `gen.js`, `detail.js`, `search.js`, `toc.js`, `chap.js`, packaged into `plugin.zip`).
- Stream format: JSON string returning `{"url": "...", "type": "native"|"auto", "headers": {...}}` with real playable `.m3u8` / `.mp4` streams or working embeds (NOT `streamfree.vip`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Chinese 3D Animation Extension | Working vBook video extension for Hoạt hình 3D Trung Quốc with playable streams | M1 | ORIGINAL_REQUEST |
| 2 | Chinese AI Animation Extension | Working vBook video extension for Hoạt hình AI Trung Quốc / AI comic-video with playable streams | M1 | ORIGINAL_REQUEST |
| 3 | Packaging & Catalog Update | Package `plugin.zip`, update `plugin.json` catalog in `Qsang_vbook` and `Qsang_vbook_pro` | M1 | ORIGINAL_REQUEST |
| 4 | Validation & GitHub Push | Pass `validate.js` and `health-check.js` and push to GitHub | M1 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Build, Verify & Push 2 Video Extensions | Explore sources, implement 3D & AI animation extensions, validate, health-check, push | none | IN_PROGRESS |

## Interface Contracts
- `chap.js`: Must return `Response.success(JSON.stringify({ url, type, headers }))` where `url` is a verified `.m3u8` / `.mp4` or working embed URL.
- Repository scripts: Must pass `node scripts/validate.js` and `node scripts/health-check.js`.
