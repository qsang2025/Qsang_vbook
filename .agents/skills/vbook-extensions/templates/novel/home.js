// home.js — cac tab trang chu (template novel).
// Y tuong: Darkrai9x (tab input truyen sang script) + SPRINGPEACHVINH
// (renderer danh sach dung chung book.js). Moi tab co input la duong dan
// chuyen muc; app se goi book.js voi input do (xem book.js).
// Khong can load config.js vi home.js mau nay khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/moi-cap-nhat", script: "book.js" },
        { title: "Truyện hot", input: "/truyen-hot", script: "book.js" },
        { title: "Truyện full", input: "/truyen-full", script: "book.js" },
        { title: "Đang phát hành", input: "/dang-phat-hanh", script: "book.js" },
        { title: "Hoàn thành", input: "/hoan-thanh", script: "book.js" },
        { title: "Xem nhiều", input: "/xem-nhieu", script: "book.js" }
    ]);
}
