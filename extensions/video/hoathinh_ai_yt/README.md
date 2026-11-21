# Hoạt Hình AI YouTube (v4)

Extension vBook xem **Hoạt Hình AI Trung Quốc / Donghua 3D** trên YouTube (`https://www.youtube.com`), tập trung vào:

- **Tab Khám Phá & Marathon Mới (v4)**: `Marathon Trên 3 Tiếng` (`min:10800:`), `Top Xem Nhiều Nhất` (`sort:view_count:`), `Mới Ra Trong Tuần` (`sort:upload_date:`) kèm hỗ trợ prefix `min:<seconds>:` và `sort:<mode>:` trong `search.js`.
- **AI Voice / Quality Badges & Làm Gọn Tiêu Đề (`CLEAN_TITLES`, v4)**: tự động gắn nhãn `Thuyết Minh • 4K`, `Trọn Bộ • Full`, `Thuyết Minh`, `Vietsub`, `Marathon` (>= 3 tiếng); tự động làm gọn tiêu đề tập trong mục lục playlist (`Tập N - ...`, bỏ tag/hashtag rác).
- **Lọc Ưu Tiên Bản Thuyết Minh / Trọn Bộ (`AUDIO_FILTER`, v4)**: hỗ trợ `all`, `thuyet_minh`, `tron_bo` trong cài đặt để ưu tiên kết quả phù hợp.
- **Cloud Invidious Auto-Discovery & Cross-Source Fallback `YouTube -> Dailymotion` (v4)**: tự động tìm tối đa 4 instance Invidious HTTPS khỏe qua `api.invidious.io` (`3500ms`), và tự động fallback sang tìm kiếm HLS trên Dailymotion khi mọi resolver YouTube thất bại.

- **Bộ AI Dài Tập (Playlist) & Gom Phần Cùng Bộ (Smart Multi-Part Aggregator)**: tự động phân trang `continuation` lấy toàn bộ tập, bỏ qua video Private/Deleted/Shorts (< 120s), tự động chuẩn hóa thứ tự `Tập 1 -> Tập N`; tự động tìm các `Phần 1 -> Phần K` cùng tên gốc trên kênh khi xem video lẻ.
- **Bản Full Nhiều Tiếng & Tùy chỉnh thời lượng tối thiểu (`MIN_DURATION`)**: mặc định lọc video `< 1200s` (20 phút), hỗ trợ chọn `600s` (10p) / `1200s` (20p) / `3600s` (60p) trong cài đặt.
- **Sắp xếp tìm kiếm (`SORT_BY`) & Anti-Noise Filter**: hỗ trợ `relevance`, `upload_date`, `view_count`, `duration`; tự động lọc bỏ karaoke, nhạc nền, OST, trailer, teaser, reaction, behind the scenes và livestream.
- **Kênh Tuyển Chọn & Kênh Bổ Sung (`CUSTOM_CHANNELS`)**: CibiiSub, Zzzphim, Não Phẳng Tu Tiên, 2K Sub, Giấc Mộng Tu Tiên, Pi Studio + hỗ trợ thêm `@handle` hoặc `UC...` qua cấu hình.
- **Chia tập theo Timestamp / Mốc 30 phút (Dual-Bound `timeSkip`)**: tự động tách các chương từ mô tả video (`00:00`, `1:23:45`...) hoặc chia mốc 30 phút với video `>= 1 tiếng`, gắn `&t=&end=&dur=` để tua chính xác đầu & cuối đoạn.
- **Mưa bình luận (`ENABLE_DANMAKU`)**: tự động chuyển đổi tối đa 40 bình luận YouTube hàng đầu thành `danmaku` (`type: "json"`) theo timestamp hoặc rải đều suốt tập (có thể bật/tắt trong cài đặt).
- **2K 1440p / 4K 2160p & Chất lượng ưu tiên (`PREFERRED_QUALITY`)**: hỗ trợ chọn `auto_hls`, `4k_2k`, `1080p`, `720p`, ghi nhớ client InnerTube thành công trong phiên (`_preferredPlayerClient`), kèm phụ đề VTT tự dịch, multi-audio và SponsorBlock Auto-Skip.
- **Phát Native HLS / MP4**: 3-tier stream resolver (YouTube InnerTube `ANDROID`/`IOS`/`ANDROID_VR` -> Piped -> Invidious) kèm track `Re-resolve`.

## License

MIT License (c) 2026 Dương Nguyễn Quốc Sáng (Qsang_vbook).
