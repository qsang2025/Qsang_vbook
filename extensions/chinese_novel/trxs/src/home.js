// home.js — cac tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md muc 6.9).
//
// Site chi co 2 danh sach that + 1 bang xep hang:
// - /tongren/      : tat ca truyen dong nhan (phan trang /tongren/index_<n>.html)
// - /tags-150-0.html : truyen 全本同人 (phan trang 0-based /tags-150-<k>.html)
// - /tags-151-0.html : truyen 连载同人 (phan trang 0-based)
// - /rating/       : bang xep hang 高分榜单 (1 trang)
// Moi tab tro ve gen.js voi input la URL day du cua chuyen muc.
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "同人小说", input: BASE_URL + "/tongren/", script: "gen.js" },
        { title: "全本同人", input: BASE_URL + "/tags-150-0.html", script: "gen.js" },
        { title: "连载同人", input: BASE_URL + "/tags-151-0.html", script: "gen.js" },
        { title: "高分榜单", input: BASE_URL + "/rating/", script: "gen.js" }
    ]);
}
