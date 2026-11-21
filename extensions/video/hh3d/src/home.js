// home.js — cac tab danh muc tren man hinh chinh cua HH3D (hh3d.ad).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "Hoạt Hình 3D", input: "/popular-tag/hoat-hinh-3d/", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh/", script: "search.js" },
        { title: "Lịch Chiếu", input: "/lich-chieu/", script: "search.js" },
        { title: "Phim Lẻ", input: "/phim-le/", script: "search.js" }
    ]);
}
