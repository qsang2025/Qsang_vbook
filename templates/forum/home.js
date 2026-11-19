// home.js — cac tab trang chu (template forum).
// Moi tab co input la duong dan chuyen muc; app se goi search.js voi input
// do (search.js coi query bat dau bang "/" hoac "http" la duong dan danh
// sach, khong phai tu khoa tim kiem).
// Khong fetch gi o day: tab dau tien phai tinh, fetch loi se chan ca trang chu.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/tin-moi", script: "search.js" },
        { title: "Nổi bật", input: "/noi-bat", script: "search.js" }
        // Tab mo trang explore thay vi list: them type: "explore",
        // vd { title: "Trang chủ", input: "", script: "feed.js", type: "explore" }
    ]);
}
