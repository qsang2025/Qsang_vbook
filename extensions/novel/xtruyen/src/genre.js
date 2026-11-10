// genre.js — danh sach the loai tinh cua XTruyen (khong fetch).
// Duong dan /theloai/<slug>/ theo giao dien site; moi muc tro ve book.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "Tiên Hiệp", input: BASE_URL + "/theloai/tien-hiep/", script: "book.js" },
        { title: "Kiếm Hiệp", input: BASE_URL + "/theloai/kiem-hiep/", script: "book.js" },
        { title: "Ngôn Tình", input: BASE_URL + "/theloai/ngon-tinh/", script: "book.js" },
        { title: "Đam Mỹ", input: BASE_URL + "/theloai/dam-my/", script: "book.js" },
        { title: "Bách Hợp", input: BASE_URL + "/theloai/bach-hop/", script: "book.js" },
        { title: "Đô Thị", input: BASE_URL + "/theloai/do-thi/", script: "book.js" },
        { title: "Quan Trường", input: BASE_URL + "/theloai/quan-truong/", script: "book.js" },
        { title: "Võng Du", input: BASE_URL + "/theloai/vong-du/", script: "book.js" },
        { title: "Khoa Huyễn", input: BASE_URL + "/theloai/khoa-huyen/", script: "book.js" },
        { title: "Hệ Thống", input: BASE_URL + "/theloai/he-thong/", script: "book.js" },
        { title: "Huyền Huyễn", input: BASE_URL + "/theloai/huyen-huyen/", script: "book.js" },
        { title: "Dị Giới", input: BASE_URL + "/theloai/di-gioi/", script: "book.js" },
        { title: "Dị Năng", input: BASE_URL + "/theloai/di-nang/", script: "book.js" },
        { title: "Quân Sự", input: BASE_URL + "/theloai/quan-su/", script: "book.js" },
        { title: "Lịch Sử", input: BASE_URL + "/theloai/lich-su/", script: "book.js" },
        { title: "Xuyên Không", input: BASE_URL + "/theloai/xuyen-khong/", script: "book.js" },
        { title: "Xuyên Nhanh", input: BASE_URL + "/theloai/xuyen-nhanh/", script: "book.js" },
        { title: "Trọng Sinh", input: BASE_URL + "/theloai/trong-sinh/", script: "book.js" },
        { title: "Trinh Thám", input: BASE_URL + "/theloai/trinh-tham/", script: "book.js" },
        { title: "Linh Dị", input: BASE_URL + "/theloai/linh-di/", script: "book.js" },
        { title: "Ngược", input: BASE_URL + "/theloai/nguoc/", script: "book.js" },
        { title: "Sắc", input: BASE_URL + "/theloai/sac/", script: "book.js" },
        { title: "Sủng", input: BASE_URL + "/theloai/sung/", script: "book.js" },
        { title: "Cung Đấu", input: BASE_URL + "/theloai/cung-dau/", script: "book.js" },
        { title: "Nữ Cường", input: BASE_URL + "/theloai/nu-cuong/", script: "book.js" },
        { title: "Gia Đấu", input: BASE_URL + "/theloai/gia-dau/", script: "book.js" },
        { title: "Tổng Tài", input: BASE_URL + "/theloai/tong-tai/", script: "book.js" },
        { title: "Đông Phương", input: BASE_URL + "/theloai/dong-phuong/", script: "book.js" },
        { title: "Hài Hước", input: BASE_URL + "/theloai/hai-huoc/", script: "book.js" },
        { title: "Điền Văn", input: BASE_URL + "/theloai/dien-van/", script: "book.js" },
        { title: "Truyện Teen", input: BASE_URL + "/theloai/truyen-teen/", script: "book.js" },
        { title: "Mạt Thế", input: BASE_URL + "/theloai/mat-the/", script: "book.js" },
        { title: "Cổ Đại", input: BASE_URL + "/theloai/co-dai/", script: "book.js" },
        { title: "Phương Tây", input: BASE_URL + "/theloai/phuong-tay/", script: "book.js" },
        { title: "Nữ Phụ", input: BASE_URL + "/theloai/nu-phu/", script: "book.js" },
        { title: "Light Novel", input: BASE_URL + "/theloai/light-novel/", script: "book.js" },
        { title: "Đoản Văn", input: BASE_URL + "/theloai/doan-van/", script: "book.js" },
        { title: "Thám Hiểm", input: BASE_URL + "/theloai/tham-hiem/", script: "book.js" },
        { title: "Việt Nam", input: BASE_URL + "/theloai/viet-nam/", script: "book.js" },
        { title: "Hiện Đại", input: BASE_URL + "/theloai/Hien-Dai/", script: "book.js" },
        { title: "Khác", input: BASE_URL + "/theloai/khac/", script: "book.js" }
    ]);
}
