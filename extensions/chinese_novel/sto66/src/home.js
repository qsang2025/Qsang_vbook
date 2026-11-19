// home.js — cac tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md muc 6.9).
//
// Cac chuyen muc that cua sto66.com (nav chinh): 书库 /library.html,
// 排行 /ranking.html, 全本 /full.html, 最近更新 /ranking/update.html.
// Tat ca deu dung chung layout danh sach .bookbox nen tro ve search.js
// (renderer danh sach dung chung) voi input la URL chuyen muc day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "排行榜", input: BASE_URL + "/ranking.html", script: "search.js" },
        { title: "最近更新", input: BASE_URL + "/ranking/update.html", script: "search.js" },
        { title: "全本", input: BASE_URL + "/full.html", script: "search.js" },
        { title: "书库", input: BASE_URL + "/library.html", script: "search.js" }
    ]);
}
