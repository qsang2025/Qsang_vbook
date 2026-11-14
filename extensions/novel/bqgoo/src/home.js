// home.js — cac tab trang chu cua Bqgoo (bqgooo.cc).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la ten danh sach trong /api/index (hotlist / toplist /
// uplist / addlist). book.js se goi /api/index mot lan roi lay ra
// danh sach tuong ung.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "热门小说", input: "hotlist", script: "book.js" },
        { title: "排行榜", input: "toplist", script: "book.js" },
        { title: "最新更新", input: "uplist", script: "book.js" },
        { title: "最新入库", input: "addlist", script: "book.js" }
    ]);
}
