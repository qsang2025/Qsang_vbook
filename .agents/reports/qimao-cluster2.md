# Báo cáo Cụm bước 2: Triển khai các script Điều hướng (home, genre, gen, search) — Qimao Extension

- **Thời gian**: 2026-11-09
- **Nhánh**: `feature/qimao-ag` (Repo: `Qsang_vbook`)
- **Tác vụ**: Cụm bước 2 của Kế hoạch `.agents/plans/2026-11-09-qimao-extension.md`

---

## 1. Kết quả thực hiện

### Step 3: Triển khai `src/home.js` và `src/genre.js`
- **`src/home.js`**:
  - Trả về 6 tab tĩnh chuẩn vBook (không fetch HTTP theo đúng AGENTS.md mục 6.9):
    1. 男频人气 (Phổ biến nam) -> `0-a-a-a-a-a-a-click` trỏ tới `gen.js`
    2. 女频人气 (Phổ biến nữ) -> `1-a-a-a-a-a-a-click` trỏ tới `gen.js`
    3. 最新入库 (Mới cập nhật toàn bộ) -> `a-a-a-a-a-a-a-update_time` trỏ tới `gen.js`
    4. 出版图书 (Sách xuất bản) -> `2-a-a-a-a-a-a-click` trỏ tới `gen.js`
    5. 男频最新 (Nam mới nhất) -> `0-a-a-a-a-a-a-update_time` trỏ tới `gen.js`
    6. 女频最新 (Nữ mới nhất) -> `1-a-a-a-a-a-a-update_time` trỏ tới `gen.js`
- **`src/genre.js`**:
  - Trích xuất 122 danh mục chi tiết từ cấu trúc NUXT chính thức của 七猫 (`https://www.qimao.com/shuku/`).
  - Phân nhóm rõ ràng:
    - **Nam (`男 · ...`)**: Lịch sử (Xuyên việt, Giá không, Truyện ký...), Quân sự (Hiện đại, Kháng chiến, Điệp chiến, Chiến tranh ảo tưởng...), Khoa huyễn (Cơ giáp, Mạt thế, Tương lai...), Trò chơi (Esports, Võng du...), Huyền huyễn kỳ huyễn (Đông phương, Dị thế, Tây phương, Chư thiên, Vương triều...), Đô thị (Giải trí, Nông thôn, Cao võ, Cao thủ, Thương chiến, Học đường, Linh khí phục tô...), Kỳ văn dị sự (Trinh thám, Khủng bố...), Võ hiệp tiên hiệp (Cổ điển, Truyền thống, Tu chân...), Thể thao, N thứ nguyên (Đồng nhân, Khinh tiểu thuyết...), Hiện thực bách thái.
    - **Nữ (`女 · ...`)**: Hiện đại ngôn tình (Tổng tài hào môn, Nơi làm việc, Dân quốc, Minh tinh, Niên đại trọng sinh...), Cổ đại ngôn tình (Chủng điền, Cung đấu, Quyền mưu...), Ảo tưởng ngôn tình (Huyền huyễn, Khoa huyễn, Khoái xuyên, Mạt thế...), Du hí cạnh kỹ, Đồng nhân, Hiện thực.
    - **Xuất bản (`出版 · ...`)**: Văn học nghệ thuật, Nhân văn xã khoa, Kinh quản lệ chí, Kinh điển văn học, Xuất bản tiểu thuyết, Thiếu nhi giáo dục.
  - Tất cả item đều có `{ title, input, script: "gen.js" }`.

### Step 4: Triển khai `src/gen.js` (Phân trang danh mục)
- Phân tích linh hoạt mã `input` thành chuỗi đường dẫn 7 tham số theo chuẩn URL thư viện mới nhất của Qimao:
  `BASE_URL + "/shuku/" + channel + "-" + cat1 + "-" + cat2 + "-" + words + "-" + updateTime + "-" + isVip + "-" + isOver + "-" + order + "-" + page + "/"`
- Tải HTML và trích xuất danh sách sách từ thẻ `li.qm-cover-text-item`:
  - `name`: Tên truyện đã lọc sạch
  - `link`: Chuẩn hóa URL sang `BASE_URL + "/shuku/" + bookId + "/"` (lọc bỏ hậu tố `_0` nếu có)
  - `cover`: Link ảnh bìa CDN độ nét cao
  - `description`: Tác giả và tóm tắt truyện
  - `author`: Tác giả
  - `host`: `BASE_URL`
- Tự động nhận diện phân trang `next` dựa vào thẻ số trang kế tiếp `class="page-btn num">page+1</span>`.

### Step 5: Triển khai `src/search.js` (Tìm kiếm truyện)
- Gọi trực tiếp Native App API v7:
  `GET https://api-bc.wtzw.com/api/v7/search/words?wd=<key>&page=<page>&sign=<sign>`
- Ký tự động bằng hàm `signQuery(queryParam)` với muối bảo mật `d3dGiJc651gSQ8w1`.
- Kèm đầy đủ các App Headers chuẩn (`platform`, `app-version`, `application-id`, `sign`, `user-agent`).
- Lọc bỏ các mục không phù hợp (`show_type: 4`).
- Trích xuất: `name` (bóc bỏ highlight `<b><font>`), `link` (`/shuku/<id>/`), `cover`, `description`, `author`, `host`.
- Hỗ trợ phân trang `next` theo `json.data.meta.total_page`.
- Trả về `Response.error` tiếng Việt khi thiếu từ khóa hoặc lỗi kết nối.

---

## 2. Kết quả kiểm thử & Đối soát

1. **Linter Rhino ES6**:
   - Quét toàn bộ các file `config.js`, `home.js`, `genre.js`, `gen.js`, `search.js`:
   - Kết quả: **PASS 100% (0 vi phạm cú pháp)**. Không chứa `const`, `let`, `=>`, ````, `?.`, `??`, `...`, `.flat()`.
2. **Kiểm thử tích hợp trong môi trường Sandbox giả lập Rhino**:
   - `home.js`: Trả về 6 tabs tĩnh hợp lệ.
   - `genre.js`: Trả về 122 thể loại phong phú, đầy đủ nhánh con.
   - `gen.js`: Trả về 15 sách thực tế trang 1 và `next: "2"`.
   - `search.js` với từ khóa `"剑来"`: Trả về 10 sách thực tế, sách đầu tiên ID `143170`, tác giả `烽火戏诸侯`, `next: "2"`.
   - `search.js` với từ khóa `"第一凤女"`: Trả về 10 sách thực tế, sách đầu tiên ID `1803136`, tác giả `十二妖`.

---

## 3. Git commit
- Đã commit lên nhánh `feature/qimao-ag`:
  - Hash: `be6bbe8`
  - Message: `feat(qimao): implement navigation scripts (home, genre, gen, search)`
