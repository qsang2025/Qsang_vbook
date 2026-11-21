// home.js — cac tab trang chu YanHH3D (tab tinh, KHONG fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/moi-cap-nhat", script: "search.js" },
        { title: "Đang Chiếu", input: "/dang-chieu", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh", script: "search.js" },
        { title: "Hoạt Hình AI", input: "/hoat-hinh-ai", script: "search.js" },
        { title: "Hoạt Hình 3D", input: "/hoat-hinh-3d", script: "search.js" },
        { title: "Phim Lẻ", input: "/phim-le", script: "search.js" }
    ]);
}
