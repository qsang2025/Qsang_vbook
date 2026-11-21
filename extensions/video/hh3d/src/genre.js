// genre.js — danh sach the loai cua HH3D (tab tinh, khong fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep/", script: "search.js" },
        { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen/", script: "search.js" },
        { title: "Kiếm Hiệp", input: "/the-loai/kiem-hiep/", script: "search.js" },
        { title: "Cổ Trang", input: "/the-loai/co-trang/", script: "search.js" },
        { title: "Hiện Đại", input: "/the-loai/hien-dai/", script: "search.js" },
        { title: "Xuyên Không", input: "/the-loai/xuyen-khong/", script: "search.js" },
        { title: "Trùng Sinh", input: "/the-loai/trung-sinh/", script: "search.js" },
        { title: "Hài Hước", input: "/the-loai/hai-huoc/", script: "search.js" },
        { title: "Hoạt Hình 3D", input: "/popular-tag/hoat-hinh-3d/", script: "search.js" },
        { title: "HHTQ", input: "/popular-tag/hhtq/", script: "search.js" },
        { title: "Tiên Nghịch", input: "/popular-tag/tien-nghich/", script: "search.js" },
        { title: "Già Thiên", input: "/popular-tag/gia-thien/", script: "search.js" },
        { title: "Phim Lẻ", input: "/phim-le/", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh/", script: "search.js" },
        { title: "Đánh Giá Cao", input: "/danh-gia-cao/", script: "search.js" }
    ]);
}
