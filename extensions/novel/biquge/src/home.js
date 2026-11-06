// home.js — cac tab trang chu cua 笔趣阁 (biquge.tw).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input /sort/<slug>/ (trang danh sach the loai). Ba the loai nguoi
// dung yeu cau dat len dau: 武侠修真 (tu tien), 都市言情 (do thi),
// 游戏竞技 (vong du).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "武侠修真", input: "/sort/wuxia/", script: "book.js" },
        { title: "都市言情", input: "/sort/dushi/", script: "book.js" },
        { title: "游戏竞技", input: "/sort/youxi/", script: "book.js" },
        { title: "玄幻魔法", input: "/sort/xuanhuan/", script: "book.js" },
        { title: "科幻灵异", input: "/sort/kehuan/", script: "book.js" },
        { title: "历史军事", input: "/sort/lishi/", script: "book.js" }
    ]);
}
