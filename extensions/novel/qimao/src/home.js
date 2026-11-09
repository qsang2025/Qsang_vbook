// home.js — cac tab trang chu cua 七猫免费小说 (qimao.com).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan danh sach that cua site (khao sat 2026-11-09):
//   /shuku/a-a-a-a-a-a-0-update_time-1/ = 连载中, sap xep theo cap nhat
//   /shuku/a-a-a-a-a-a-1-click-1/ = 已完结, sap xep theo click
//   /shuku/1-a-a-a-2-a-0-update_time-1/ = 7天内更新, 连载中
//   /paihang/boy/hot/date/ = 男生热销日榜
//   /paihang/girl/hot/date/ = 女生热销日榜
//   /paihang/boy/new/date/ = 男生新书日榜
//   /paihang/girl/new/date/ = 女生新书日榜
// (trang chu / la Nuxt shell + JS, khong parse duoc bang fetch thuong,
// nen tab tro thang vao trang danh sach SSR chuyen dung.)
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "连载更新", input: "/shuku/a-a-a-a-a-a-0-update_time-1/", script: "book.js" },
        { title: "已完结", input: "/shuku/a-a-a-a-a-a-1-click-1/", script: "book.js" },
        { title: "7天内更新", input: "/shuku/1-a-a-a-2-a-0-update_time-1/", script: "book.js" },
        { title: "男生热销榜", input: "/paihang/boy/hot/date/", script: "book.js" },
        { title: "女生热销榜", input: "/paihang/girl/hot/date/", script: "book.js" },
        { title: "男生新书榜", input: "/paihang/boy/new/date/", script: "book.js" },
        { title: "女生新书榜", input: "/paihang/girl/new/date/", script: "book.js" }
    ]);
}
