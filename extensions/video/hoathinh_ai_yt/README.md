# Hoạt Hình AI YouTube (v11)

Extension vBook xem **Hoạt Hình AI Trung Quốc / Donghua 3D** trên YouTube (`https://www.youtube.com`), tập trung vào:

- **Giải mã Stream Tươi Lúc Bấm Play (`chap.js` -> `track.js`) & Fallback Webview (v11)**: `chap.js` chỉ đóng gói descriptor nhẹ (không giữ link hết hạn), `track.js` giải stream tươi mỗi lần phát (4K/2K AV1, 1080p/720p H.264/AV1, 360p, Audio-only) và tự động fallback sang Webview YouTube nếu mọi resolver bị chặn.
- **Pacing Chống Rate-Limit & Rủi Ro Bền (v11)**: Tích hợp `rate-limit.js` (`pacedFetch` / `rateLimitDelay`), bỏ giả mạo User-Agent & cờ `contentCheckOk`/`racyCheckOk`, quản lý sức khỏe Piped/Invidious và chấm điểm khớp tiêu đề cho Dailymotion/PhimAPI (`>= 0.45`).
- **Tự động Tách Tập từ Bình luận Ghim & Tự Bỏ Qua Intro (`AUTO_SKIP_INTRO`, v10)**: Tự động quét top 10 bình luận qua InnerTube `next` nếu mô tả không có mốc thời gian; hỗ trợ bỏ qua Intro đầu video (`15s–60s`) khi chưa có SponsorBlock.
- **Kho Kênh Cộng Đồng Đám Mây (`REMOTE_CHANNELS_URL`) & Bộ Nhớ Đệm Nhanh (`FAST_CACHE`, v10)**: Gộp sẵn 35 kênh cộng đồng từ GitHub Raw (`community_channels.json`, cache 24h) và cache `detail`/`toc` 30 phút (`< 50ms`).
- **Phân Loại Tiểu Thể Loại & Lọc Review (`FILTER_RECAP`, v9–v10)**: `Tu Tiên`, `Hệ Thống`, `Xuyên Không`, `Mạt Thế`, `Cổ Trang`, `Siêu Nét 2K/4K`, `Full End`; gắn nhãn hoặc lọc ẩn video Review/Tóm tắt.
- **Nhận Diện Đã Xem (`[Đã xem]`), Kệ Tiếp Tục Xem & Đề Xuất Liên Quan (`Up Next`, v9)**: Lưu lịch sử vào `localStorage`, kéo đề xuất động từ InnerTube `next`.
- **Phụ Đề Tự Dịch & Song Ngữ (`SUB_LANG`, v9)**: Hỗ trợ Tiếng Việt, Song ngữ (Việt + Gốc gộp 2 dòng VTT), English, 中文, kèm mưa bình luận `danmaku` & SponsorBlock.

## License

MIT License (c) 2026 Dương Nguyễn Quốc Sáng (Qsang_vbook).
