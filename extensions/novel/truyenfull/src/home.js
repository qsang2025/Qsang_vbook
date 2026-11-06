// home.js — cac tab trang chu cua Truyen Full.
// Cac tab deu tro ve book.js (renderer danh sach dung chung); input la
// duong dan chuyen muc tren site (khao sat 2026-11-06):
//   /danh-sach/truyen-moi/   "Moi cap nhat"
//   /danh-sach/truyen-hot/   "Truyen hot"
//   /the-loai/tien-hiep/     "Tien Hiep"
//   /the-loai/do-thi/        "Do Thi"
//   /the-loai/vong-du/       "Vong Du"
//   /danh-sach/truyen-full/  "Truyen full"
// Khong can load config.js vi home.js khong fetch gi ca (quy tac 9).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/danh-sach/truyen-moi/", script: "book.js" },
        { title: "Truyện hot", input: "/danh-sach/truyen-hot/", script: "book.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep/", script: "book.js" },
        { title: "Đô Thị", input: "/the-loai/do-thi/", script: "book.js" },
        { title: "Võng Du", input: "/the-loai/vong-du/", script: "book.js" },
        { title: "Truyện full", input: "/danh-sach/truyen-full/", script: "book.js" }
    ]);
}
