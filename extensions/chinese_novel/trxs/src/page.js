// page.js — PHAN TRANG MUC LUC (execute(url) -> [tocUrl, ...]).
// trxs.cc tra toan bo danh sach chuong ngay tren trang chi tiet, nen URL muc
// luc chinh la trang sach. Chuan hoa ve dang /tongren/<id>.html (app co the
// cat mat ".html" khi truyen URL).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(url) {
    var u = String(url || "");
    var m = u.match(/\/tongren\/(\d+)(?:\.html)?/);
    if (!m) {
        // Khong phai trang sach — tra nguyen de toc.js bao loi.
        if (u.indexOf("http") === 0 && u) return Response.success([u]);
        return Response.error("URL không hợp lệ: " + url);
    }
    return Response.success([BASE_URL + "/tongren/" + m[1] + ".html"]);
}
