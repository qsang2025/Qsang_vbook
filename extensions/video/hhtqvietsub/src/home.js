// home.js — cac tab trang chu (chi tra tab tinh, KHONG fetch).
// App chay tab dau tien ngay khi mo extension; tab tro ve search.js voi
// input la duong dan danh sach that cua hhtq.press (khao sat 2026-11-20:
// /last-update, /completed, /country/trung-quoc, /az-list).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/last-update", script: "search.js" },
        { title: "Hoàn Thành", input: "/completed", script: "search.js" },
        { title: "Trung Quốc", input: "/country/trung-quoc", script: "search.js" },
        { title: "Danh Sách A-Z", input: "/az-list", script: "search.js" }
    ]);
}
