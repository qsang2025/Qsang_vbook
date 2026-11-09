// home.js — cac tab trang chu cua 爱下电子书 (ixdzs8.com).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan danh sach that cua site (khao sat 2026-11-09):
//   /new/ = 最近更新 (200 trang, ?page=N)
//   /hot/ = 热门排行 (50 trang, ?page=N)
//   /end/ = 全本小说 (200 trang, ?page=N)
//   /sort/1/ 玄幻奇幻, /sort/2/ 修真仙侠, /sort/3/ 都市青春,
//   /sort/6/ 科幻灵异, /sort/7/ 言情穿越
// (trang chu / co cac muc tuong tu nhung dung nhieu markup khac nhau —
// u-img / u-list / u-line — nen tab tro thang vao trang danh sach chuyen
// dung, dong nhat ul.u-list > li.burl).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "最近更新", input: "/new/", script: "book.js" },
        { title: "热门排行", input: "/hot/", script: "book.js" },
        { title: "全本小说", input: "/end/", script: "book.js" },
        { title: "玄幻奇幻", input: "/sort/1/", script: "book.js" },
        { title: "修真仙侠", input: "/sort/2/", script: "book.js" },
        { title: "都市青春", input: "/sort/3/", script: "book.js" },
        { title: "科幻灵异", input: "/sort/6/", script: "book.js" },
        { title: "言情穿越", input: "/sort/7/", script: "book.js" }
    ]);
}
