# STATUS — Trạng thái các nguồn (sinh tự động)

> **Chưa có nguồn nào.** Repo mới lập khung sườn, thư mục `extensions/` vẫn
> trống. Bảng dưới đây sẽ được điền khi nguồn đầu tiên được thêm vào.

## Cơ chế cập nhật tự động

File này **không sửa tay**. GitHub Actions (CI health-check) chạy **hàng tuần**
và khi chạy tay sẽ sinh lại file này:

- **Job 1 — luôn chạy, không cần điện thoại:** `validate` (catalog ≡ đĩa,
  JSON hợp lệ, version khớp) + `build` + kiểm tra golden fixture
  (`test.json`) của từng nguồn.
- **Job 2 — chỉ khi chạy tay có cấu hình `VBOOK_SERVER`:** `testall` trên
  thiết bị thật qua developer server. CI không có điện thoại thì **không
  chạy được `testall`** — job 2 là tùy chọn, không phải mặc định.

Khi một nguồn gãy, CI tự mở issue báo nguồn đó gãy.

## Trạng thái

| Trạng thái | Nghĩa |
|---|---|
| WORK | Nguồn đang chạy tốt (fixture pass, build pass). |
| MOVED | Site đổi domain/mirror — extension đã chuyển sang mirror khác trong danh sách failover, hoặc cần cập nhật `config.js`. |
| AUTH | Nguồn cần đăng nhập / trả phí / bị chặn (Cloudflare, 429…) — chưa chạy được nếu không có session. |
| EMPTY | Nguồn chạy nhưng không trả về dữ liệu (site đổi giao diện, selector cũ hết tác dụng). |
| CRASH | Extension lỗi khi chạy (lỗi script, `Response.error`, crash runtime). |
| UNREACHABLE | Không kết nối được tới site/mirror nào (site sập, mạng chặn). |

## Bảng nguồn

| Nguồn | Loại | Trạng thái | Ghi chú / chết từ khi nào |
|---|---|---|---|
| _chưa có_ | — | — | — |

_Cập nhật lần cuối: chưa chạy CI lần nào._
