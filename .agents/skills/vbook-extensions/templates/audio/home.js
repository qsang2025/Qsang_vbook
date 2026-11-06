// home.js — cac tab trang chu (template novel).
// Y tuong: Darkrai9x (tab input truyen sang script) + SPRINGPEACHVINH
// (renderer danh sach dung chung search.js). Moi tab co input la duong dan
// chuyen muc; app se goi search.js voi input do (xem search.js).
// Khong can load config.js vi home.js mau nay khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Album mới", input: "/album-moi", script: "search.js" },
        { title: "Album hot", input: "/album-hot", script: "search.js" },
        { title: "Truyện audio", input: "/truyen-audio", script: "search.js" },
        { title: "Đang phát hành", input: "/dang-phat-hanh", script: "search.js" },
        { title: "Hoàn thành", input: "/hoan-thanh", script: "search.js" },
        { title: "Xem nhiều", input: "/xem-nhieu", script: "search.js" }
    ]);
}
