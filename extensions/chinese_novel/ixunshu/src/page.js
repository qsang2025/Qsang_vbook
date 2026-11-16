// page.js — Trang muc luc (execute(url) -> [url]).
// Muc luc chi co 1 trang (#content_1 tren /xs/<id>/zjml/1, khong co
// #indexselect — kiem chung live 2026-11-16) nen chi tra 1 URL.
// Tai len: file config.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(url) {
    var target = normalizeIxUrl(url);
    if (!target) return Response.error("Đường dẫn truyện không hợp lệ.");
    return Response.success([target.replace(/\/+$/, "") + "/zjml/1"]);
}
