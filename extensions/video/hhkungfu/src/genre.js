// genre.js — danh sach the loai cua HHKUNGFU (tab tinh, khong fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Tu Tiên", input: "/category/tu-tien", script: "search.js" },
        { title: "Luyện Cấp", input: "/category/luyen-cap", script: "search.js" },
        { title: "Trùng Sinh", input: "/category/trung-sinh", script: "search.js" },
        { title: "Kiếm Hiệp", input: "/category/kiem-hiep", script: "search.js" },
        { title: "Xuyên Không", input: "/category/xuyen-khong", script: "search.js" },
        { title: "Hài Hước", input: "/category/hai-huoc", script: "search.js" },
        { title: "Hiện Đại", input: "/category/hien-dai", script: "search.js" },
        { title: "OVA", input: "/category/ova", script: "search.js" },
        { title: "Mới Cập Nhật", input: "/moi-cap-nhat", script: "search.js" },
        { title: "Top Xem Nhiều", input: "/top-xem-nhieu", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh", script: "search.js" }
    ]);
}
