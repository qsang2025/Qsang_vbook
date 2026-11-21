// home.js — cac tab trang chu HH3D (tab tinh, KHONG fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/", script: "search.js" },
        { title: "Hoạt Hình 3D", input: "/popular-tag/hoat-hinh-3d/", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh/", script: "search.js" },
        { title: "Phim Lẻ", input: "/phim-le/", script: "search.js" },
        { title: "Đánh Giá Cao", input: "/danh-gia-cao/", script: "search.js" },
        { title: "Lịch Chiếu", input: "/lich-chieu/", script: "search.js" }
    ]);
}
