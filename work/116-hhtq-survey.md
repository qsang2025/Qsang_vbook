# Task 116 — Khảo sát live HHTQ embed (muse-1, 20/11/2026)

## Chống trùng (PROTOCOL §3)
- Qsang_vbook: extension video/hhtqvietsub đã có (task 113 merge 38f97e8) — task 116 là FIX track, không build trùng.
- muse-teamwork tasks claimed/doing/review: chỉ 116 (muse-1) đụng HHTQ; 112 doing muse-2 (forum), 114 open preferred muse-2 (VOZ) — không trùng, không claim 114.
- STATUS.md: HHTQ Vietsub = CHƯA TEST (chờ thiết bị thật).

## Live từ VM (paced, 1 request/lần)
- Watch Tập 1 https://hhtq.press/-tru-tien/tap-1-sv1.html → 200; halim_cfg post_id=103, episode_slug=tap-1, server=1, nonce 50c148cb68.
- player.php Tập 1 → iframe https://embed1.streamc.xyz/embed.php?hash=d6774c3be4dae863699686e9a126e0bc (khớp chẩn đoán muse-main).
- Watch Tập 94 + player.php → iframe https://tenmienphu68.lol/mediav2/tap-94-sv1?skip_intro=2-21.
- Embed tenmienphu68 từ VM → 403 "Your request was blocked." (Cloudflare) — khảo sát host này phải qua điện thoại.

## Cơ chế phát của streamc (đọc từ JS đã tải: cdn-start + player r25)
- Trang embed chỉ có <script id="stream-bootstrap"> {"api": <chính URL embed>, "assets": {...}} + JWPlayer 8.51.3. Không có .m3u8/.mp4 dạng chữ → regex cũ luôn rỗng → auto → app báo lỗi máy chủ (đúng lỗi Anh gặp).
- cdn-start POST {action:"bootstrap", referrer, frame_origins, request_grant:true, playlist_format: nativeHls?"hls":"aesgcm-v2", pretty_url:true, path_chunks:true, bootstrap_format: WebCrypto?"aesgcm-v1":"json"} tới api.
  - bootstrap_format json = JSON thường (fallback khi không có WebCrypto) → track.js (Rhino) phải xin "json".
  - aesgcm-v1: key = SHA-256("stream-bootstrap-v1\n" + apiHref), AES-GCM, AAD = cùng chuỗi.
- Player POST {action:"issue", bootstrap, turnstile_response, playlist_format, pretty_url, path_chunks, frame_origins} → {playlist, playlistFormat, issuedAt, expiresAt}.
  - playlist URL là path ký mờ (80–5500 ký tự) hoặc /conf.php?t=... trên cùng origin — KHÔNG chứa ".m3u8".
  - Nếu bootstrap có preissued + turnstileEnabled=false thì dùng luôn, khỏi issue.
  - Turnstile (Cloudflare) chỉ bật khi server yêu cầu (turnstileEnabled) — fetch thường không qua được khi bật.
- playlist_format "hls" (chỉ Apple native trong JS gốc) = playlist thường. "aesgcm-v2" (Android) = playlist bị niêm phong: 4 dòng #EXTM3U / #ENC-AESGCM;iv=... / #EXT-X-B65:0-138 / base64; key = HMAC-SHA256("stream-derive-v1", videoHash). ExoPlayer native không tự giải được dạng niêm phong.

## Hướng sửa track.js
1. Giữ native trực tiếp + regex embed (rẻ, đúng khi host inline stream).
2. Mới: flow stream-bootstrap — POST bootstrap (json + xin playlist_format "hls") → preissued hoặc issue (turnstile_response "") → playlist thường → native. Nếu server trả format aesgcm* hoặc đòi Turnstile thì KHÔNG trả native (sẽ hỏng), đi tiếp bước 3.
3. Mới: Engine.newBrowser() render trang embed, chờ request media, chỉ nhận URL .m3u8/.mp4 thật → native.
4. Fallback cuối: webview (nhúng trang JWPlayer) thay auto — auto sniff hụt là lỗi cứng (đã chứng minh), webview còn nhúng trang để phát trong player.
- tenmienphu68.lol/mediav2: chưa rõ cùng hệ hay không (VM 403) — cùng pipeline tổng quát + webview fallback; kiểm chứng quyết định trên điện thoại Anh.

## Chưa kiểm chứng được từ VM
- POST bootstrap từ VM bị egress policy chặn (cần duyệt, đang chờ) — không retry dồn dập. Trên điện thoại, fetch của app đi thẳng, không qua policy này.
- Device test/install: forwarder 127.0.0.1:18080 chưa chạy (connection refused); đường tunnel tới điện thoại cũng đang chờ duyệt. Chưa chạy được device test ở lượt này.
