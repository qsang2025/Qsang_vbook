# STATUS — Trạng thái các nguồn (sinh tự động)

> Cập nhật lần cuối: 2026-11-20 00:50 UTC (CI health-check hàng ngày + chạy tay).
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
| 17k | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 52书库 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 85 Novel | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| alicesw | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Banshanren | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Biqugezz | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Bixiange | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| IHuaBen | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| NovelCooksTW | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| PO18 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| QuanBen | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| SF轻小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Shushuwuxs | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Sto66 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Tadu | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Trxs | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| uu看書 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Zhenhunxiaoshuo | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Zongheng | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 久久小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 乐文小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 书本书 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 书迷楼 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 全本同人小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 刺猬猫 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 同人社 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 图书迷 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 微風小說網 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 手机小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 抖音小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 晋江文学城 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 海棠文学 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 無限小說 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 爱寻书 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 爱趣书网 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 破万卷小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 精品小說網 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 腐小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 速读谷 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 顶点小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 飘天文学 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 饭饭小说 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 墨坛文学网 | chinese_novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| NiACG | comic | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| AkayTruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| App Truyện Chữ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| AzTruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Bàn Long | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Bqgoo | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| DocLN | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| DocTruyen14 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| FanMTL | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| iSach | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Kakuyomu | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Kỳ Huyễn | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| La Cà Truyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| LilyHub | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| MattReading | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Đọc Truyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Đọc Truyện Chữ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Truyện Chữ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Truyện Chữ Org | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Truyện Hot VN | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Mê Truyện Sáng Tác | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| MongTruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Novel Next | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| NovelPhoenix | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| QuyKhu | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| ReaderNovel | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Sách Hay Online | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Sáng Tác Việt APP | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Si Truyện CV | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| SS Truyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Storya | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TacGiaViet | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Tang Thu Vien | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TiemtruyenchuVIP | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Tiên Vực | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TrichTinhLau | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyen247 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyen4u | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenC | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenC.com | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenChu | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenCv | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenDich.AI | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenNow | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyenTV | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Full | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Hay | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Hoàn | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Hoàng Dung | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Kim Dung | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Truyện Mơ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| TruyệnHD | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| ValvrareTeam | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Việt Nam Thư Quán | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| VivuTruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Web Truyện Dịch | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Wetruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Wiki Dịch | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| WTR-LAB | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| WuxiaBox | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| WuxiaWorld | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Xa Lộ Sách | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| XTruyện | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| ZTruyen | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Zumi Novel | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 七猫免费小说 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 书海阁 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 和图书 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 小說狂人 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 小説を読もう！ | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 思兔閱讀 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 爱下电子书 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 稷下書院 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 笔趣阁 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| 繁體小說 | novel | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| HHTQ Vietsub | video | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Hoạt Hình 3D Trung Quốc | video | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |
| Hoạt Hình AI Trung Quốc | video | CHƯA TEST | chưa chạy testall (cần thiết bị thật / VBOOK_SERVER) |

Trạng thái testall: WORK (chạy tốt), MOVED (site đổi domain),
AUTH/MSG (site chặn/yêu cầu đăng nhập), EMPTY (trả về rỗng),
CRASH (script lỗi), UNREACHABLE (không tới được developer server).
