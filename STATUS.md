# STATUS — Trạng thái các nguồn (sinh tự động)

> Cập nhật lần cuối: 2026-11-11 00:40 UTC (CI health-check hàng ngày + chạy tay).
> File này **không sửa tay**. GitHub Actions sinh lại file này;
> muốn sửa trạng thái một nguồn thì sửa nguồn đó rồi chạy lại CI.

## Kiểm tra tĩnh (job validate-build)

- `validate`: PASS — catalog ≡ đĩa, JSON hợp lệ, version khớp,
  script map khớp file trong `src/`, golden fixture (`test.json`) đúng định dạng,
  mỗi nguồn đều có `plugin.zip` đã commit kèm và khớp với `src/` hiện tại.
- `build-catalog --check`: PASS — registry khớp với các nguồn trên đĩa.
- Build thử template novel: PASS (chỉ kiểm tra cơ chế, zip thử đã bỏ đi).

## Trạng thái nguồn

| Nguồn | Loại | Trạng thái testall | Ghi chú |
|---|---|---|---|
| NiACG | comic | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| App Truyện Chữ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| La Cà Truyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Truyện Chữ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Sáng Tác Việt APP | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| SS Truyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TiemtruyenchuVIP | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenC | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Full | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Hoàn | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Wetruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| XTruyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 七猫免费小说 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 书海阁 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 和图书 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 小說狂人 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 思兔閱讀 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 爱下电子书 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 稷下書院 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 笔趣阁 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 繁體小說 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Hoạt Hình 3D Trung Quốc | video | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Hoạt Hình AI Trung Quốc | video | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |

Trạng thái testall: WORK (chạy tốt), MOVED (site đổi domain),
AUTH/MSG (site chặn/yêu cầu đăng nhập), EMPTY (trả về rỗng),
CRASH (script lỗi), UNREACHABLE (không tới được developer server).
