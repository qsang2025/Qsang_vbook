// home.js — cac tab trang chu cua App Truyen Chu.
// Cac tab deu tro ve book.js (renderer danh sach dung chung); input la
// duong dan chuyen muc tren site (khao sat 2026-11-06):
//   /truyen?sort=1       "Moi cap nhat" (nut "Xem tat ca" muc Moi cap nhat)
//   /truyen?sort=2       "BTV de cu" (nut "Xem tat ca" muc BTV de cu / Moi dang)
//   /truyen?status=COMPLETED  "Moi hoan thanh" (nut "Xem tat ca" muc nay)
//   /truyen             "Tat ca truyen"
// Khong can load config.js vi home.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/truyen?sort=1", script: "book.js" },
        { title: "BTV đề cử", input: "/truyen?sort=2", script: "book.js" },
        { title: "Mới hoàn thành", input: "/truyen?status=COMPLETED", script: "book.js" },
        { title: "Tất cả truyện", input: "/truyen", script: "book.js" }
    ]);
}
