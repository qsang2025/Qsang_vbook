// genre.js — 52 muc hardcode, kiem chung live tu trang chu
// sachhayonline.com + trang /tac-gia ngay 2026-11-14: 37 the loai +
// 15 tac gia. Moi muc tro ve list.js voi URL danh sach day du.
// The loai de ten goc; tac gia them tien to "Tác giả: " de phan biet.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        {title: "Ẩm thực - Nấu ăn", input: BASE_URL + "/danh-muc/am-thuc-nau-an", script: "list.js"},
        {title: "Cổ Tích - Thần Thoại", input: BASE_URL + "/danh-muc/co-tich-than-thoai", script: "list.js"},
        {title: "Công Nghệ Thông Tin", input: BASE_URL + "/danh-muc/cong-nghe-thong-tin", script: "list.js"},
        {title: "Học Ngoại Ngữ", input: BASE_URL + "/danh-muc/hoc-ngoai-ngu", script: "list.js"},
        {title: "Hồi Ký - Tuỳ Bút", input: BASE_URL + "/danh-muc/hoi-ky-tuy-but", script: "list.js"},
        {title: "Huyền bí - Giả Tưởng", input: BASE_URL + "/danh-muc/huyen-bi-gia-tuong", script: "list.js"},
        {title: "Khoa Học - Kỹ Thuật", input: BASE_URL + "/danh-muc/khoa-hoc-ky-thuat", script: "list.js"},
        {title: "Kiếm Hiệp - Tiên Hiệp", input: BASE_URL + "/danh-muc/kiem-hiep-tien-hiep", script: "list.js"},
        {title: "Kiến Trúc - Xây Dựng", input: BASE_URL + "/danh-muc/kien-truc-xay-dung", script: "list.js"},
        {title: "Kinh Tế - Quản Lý", input: BASE_URL + "/danh-muc/kinh-te-quan-ly", script: "list.js"},
        {title: "Lịch sử", input: BASE_URL + "/danh-muc/lich-su", script: "list.js"},
        {title: "Lịch Sử - Chính Trị", input: BASE_URL + "/danh-muc/lich-su-chinh-tri", script: "list.js"},
        {title: "Marketing - Bán hàng", input: BASE_URL + "/danh-muc/marketing-ban-hang", script: "list.js"},
        {title: "Nông - Lâm - Ngư", input: BASE_URL + "/danh-muc/nong-lam-ngu", script: "list.js"},
        {title: "Phiêu Lưu - Mạo Hiểm", input: BASE_URL + "/danh-muc/phieu-luu-mao-hiem", script: "list.js"},
        {title: "Sách Giáo Khoa", input: BASE_URL + "/danh-muc/sach-giao-khoa", script: "list.js"},
        {title: "Sách Nổi Bật", input: BASE_URL + "/danh-muc/sach-noi-bat", script: "list.js"},
        {title: "Sách nói miễn phí", input: BASE_URL + "/danh-muc/sach-noi-mien-phi", script: "list.js"},
        {title: "Tâm Lý - Kỹ Năng Sống", input: BASE_URL + "/danh-muc/tam-ly-ky-nang-song", script: "list.js"},
        {title: "Các thể loại khác", input: BASE_URL + "/danh-muc/the-loai-khac", script: "list.js"},
        {title: "Thể Thao - Nghệ Thuật", input: BASE_URL + "/danh-muc/the-thao-nghe-thuat", script: "list.js"},
        {title: "Thơ Hay", input: BASE_URL + "/danh-muc/tho-hay", script: "list.js"},
        {title: "Thư Viện Pháp Luật", input: BASE_URL + "/danh-muc/thu-vien-phap-luat", script: "list.js"},
        {title: "Tiểu Thuyết Phương Tây", input: BASE_URL + "/danh-muc/tieu-thuyet-phuong-tay", script: "list.js"},
        {title: "Tiểu Thuyết Trung Quốc", input: BASE_URL + "/danh-muc/tieu-thuyet-trung-quoc", script: "list.js"},
        {title: "Triết Học", input: BASE_URL + "/danh-muc/triet-hoc", script: "list.js"},
        {title: "Trinh Thám - Hình Sự", input: BASE_URL + "/danh-muc/trinh-tham-hinh-su", script: "list.js"},
        {title: "Truyện Cười - Tiếu Lâm", input: BASE_URL + "/danh-muc/truyen-cuoi-tieu-lam", script: "list.js"},
        {title: "Truyện Ma - Truyện Kinh Dị", input: BASE_URL + "/danh-muc/truyen-ma-truyen-kinh-di", script: "list.js"},
        {title: "Truyện Teen - Tuổi Học Trò", input: BASE_URL + "/danh-muc/truyen-teen-tuoi-hoc-tro", script: "list.js"},
        {title: "Truyện Tranh", input: BASE_URL + "/danh-muc/truyen-tranh", script: "list.js"},
        {title: "Tử Vi - Phong Thủy", input: BASE_URL + "/danh-muc/tu-vi-phong-thuy", script: "list.js"},
        {title: "Văn Hóa - Tôn Giáo", input: BASE_URL + "/danh-muc/van-hoa-ton-giao", script: "list.js"},
        {title: "Văn học nước ngoài", input: BASE_URL + "/danh-muc/van-hoc-nuoc-ngoai", script: "list.js"},
        {title: "Văn học Việt Nam", input: BASE_URL + "/danh-muc/van-hoc-viet-nam", script: "list.js"},
        {title: "Văn Học Việt Nam Sách", input: BASE_URL + "/danh-muc/van-hoc-viet-nam-sach", script: "list.js"},
        {title: "Y Học - Sức Khỏe", input: BASE_URL + "/danh-muc/y-hoc-suc-khoe", script: "list.js"},
        {title: "Tác giả: Arthur Conan Doyle", input: BASE_URL + "/tac-gia/arthur-conan-doyle", script: "list.js"},
        {title: "Tác giả: Đào Trinh Nhất", input: BASE_URL + "/tac-gia/dao-trinh-nhat", script: "list.js"},
        {title: "Tác giả: Hồ Biểu Chánh", input: BASE_URL + "/tac-gia/ho-bieu-chanh", script: "list.js"},
        {title: "Tác giả: Hồ Dzếnh", input: BASE_URL + "/tac-gia/ho-dzenh", script: "list.js"},
        {title: "Tác giả: Hoàng Ngọc Phách", input: BASE_URL + "/tac-gia/hoang-ngoc-phach", script: "list.js"},
        {title: "Tác giả: Khái Hưng", input: BASE_URL + "/tac-gia/khai-hung", script: "list.js"},
        {title: "Tác giả: Nam Cao", input: BASE_URL + "/tac-gia/nam-cao", script: "list.js"},
        {title: "Tác giả: Ngô Tất Tố", input: BASE_URL + "/tac-gia/ngo-tat-to", script: "list.js"},
        {title: "Tác giả: Nguyễn Huy Tưởng", input: BASE_URL + "/tac-gia/nguyen-huy-tuong", script: "list.js"},
        {title: "Tác giả: Nhất Linh", input: BASE_URL + "/tac-gia/nhat-linh", script: "list.js"},
        {title: "Tác giả: Phan Kế Bính", input: BASE_URL + "/tac-gia/phan-ke-binh", script: "list.js"},
        {title: "Tác giả: Thạch Lam", input: BASE_URL + "/tac-gia/thach-lam", script: "list.js"},
        {title: "Tác giả: Thế Lữ", input: BASE_URL + "/tac-gia/the-lu", script: "list.js"},
        {title: "Tác giả: Trần Trọng Kim", input: BASE_URL + "/tac-gia/tran-trong-kim", script: "list.js"},
        {title: "Tác giả: Vũ Trọng Phụng", input: BASE_URL + "/tac-gia/vu-trong-phung", script: "list.js"}
    ]);
}
