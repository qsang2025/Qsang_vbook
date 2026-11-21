# Hoạt Hình AI YouTube (v2)

Extension vBook xem **Hoạt Hình AI Trung Quốc / Donghua 3D** trên YouTube (`https://www.youtube.com`), tập trung vào:

- **Bộ AI Dài Tập (Playlist)**: tự động phân trang `continuation` lấy toàn bộ tập, bỏ qua video Private/Deleted/Shorts (< 120s), tự động chuẩn hóa thứ tự `Tập 1 -> Tập N`.
- **Bản Full Nhiều Tiếng & Tùy chỉnh thời lượng tối thiểu (`MIN_DURATION`)**: mặc định lọc video `< 1200s` (20 phút), hỗ trợ chọn `600s` (10p) / `1200s` (20p) / `3600s` (60p) trong cài đặt.
- **Kênh Tuyển Chọn & Kênh Bổ Sung (`CUSTOM_CHANNELS`)**: CibiiSub, Zzzphim, Não Phẳng Tu Tiên, 2K Sub, Giấc Mộng Tu Tiên, Pi Studio + hỗ trợ thêm `@handle` hoặc `UC...` qua cấu hình.
- **Chia tập theo Timestamp / Mốc 30 phút**: tự động tách các chương từ mô tả video (`00:00`, `1:23:45`...) hoặc chia mốc 30 phút với video `>= 1 tiếng`, tua thẳng tới `startSec` qua `timeSkip`.
- **Phụ đề VTT & Tự dịch Tiếng Việt + Multi-Audio**: trích xuất `captionTracks` (tự động thêm `Tiếng Việt (Tự dịch)` nếu chưa có `vi`) và các luồng lồng tiếng (`audios`).
- **SponsorBlock Auto-Skip**: tự động bỏ qua các đoạn `sponsor`, `intro`, `outro`, `selfpromo` (timeout 2500ms, non-blocking).
- **Bình luận YouTube & Gợi ý liên quan**: đọc bình luận (`comment.js`) qua InnerTube `next` / Piped / Invidious, kèm gợi ý cùng kênh và bộ AI dài tập.
- **Phát Native HLS / MP4**: 3-tier stream resolver (YouTube InnerTube `ANDROID`/`IOS`/`ANDROID_VR` -> Piped -> Invidious) kèm track `Re-resolve`.

## License

MIT License (c) 2026 Dương Nguyễn Quốc Sáng (Qsang_vbook).
