# STATUS — Trạng thái các nguồn (sinh tự động)

> Cập nhật lần cuối: 2026-11-06 11:31 UTC (CI health-check hàng ngày + chạy tay).
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
| App Truyện Chữ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| HHKUNGFU | video | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |

Trạng thái testall: WORK (chạy tốt), MOVED (site đổi domain),
AUTH/MSG (site chặn/yêu cầu đăng nhập), EMPTY (trả về rỗng),
CRASH (script lỗi), UNREACHABLE (không tới được developer server).
