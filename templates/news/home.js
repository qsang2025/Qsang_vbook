// home.js — cac tab o trang chu extension (template news).
// Tab tinh, KHONG fetch (quy tac nha: tab dau tien chay ngay khi mo
// extension, fetch loi o day se chan ca trang chu). Input la duong dan
// chuyen muc, search.js se tai danh sach bai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/tin-moi", script: "search.js" },
        { title: "Nổi bật", input: "/noi-bat", script: "search.js" }
    ]);
}
