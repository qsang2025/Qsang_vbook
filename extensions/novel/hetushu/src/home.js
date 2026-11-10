// home.js — cac tab trang chu cua 和图书 (hetushu.com).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan danh sach. Tab dau: toan bo truyen, sau do bang
// xep hang, 3 the loai lon, roi loc theo trang thai 完本 / 连载.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "全部小说", input: "/book/index.php", script: "book.js" },
        { title: "榜单", input: "/top/index.php", script: "book.js" },
        { title: "玄幻小说", input: "/book/index.php?type=%E7%8E%84%E5%B9%BB%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "仙侠小说", input: "/book/index.php?type=%E4%BB%99%E4%BE%A0%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "都市小说", input: "/book/index.php?type=%E9%83%BD%E5%B8%82%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "完本", input: "/book/index.php?state=2", script: "book.js" },
        { title: "连载", input: "/book/index.php?state=1", script: "book.js" }
    ]);
}
