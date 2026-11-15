// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
//
// 9 the loai song (kiem chung live tu nav trang chu 2026-11-16).
// Base Moleys v1 ghi them 4 the loai chet (cyjk, xtfq, qcyq, dmtr —
// deu 404) nen bo. Cac trang the loai dung bo cuc ul.clearfix li
// (zen.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "都市情感", input: "/dsyq/", script: "zen.js" },
        { title: "同人小说", input: "/tongren/", script: "zen.js" },
        { title: "玄幻奇幻", input: "/wxxz/", script: "zen.js" },
        { title: "武侠修真", input: "/wxxz2/", script: "zen.js" },
        { title: "科幻魔法", input: "/khjj/", script: "zen.js" },
        { title: "游戏竞技", input: "/yxjj/", script: "zen.js" },
        { title: "鬼话悬疑", input: "/ghxy/", script: "zen.js" },
        { title: "军事历史", input: "/jsls/", script: "zen.js" },
        { title: "总排行榜", input: "/sort/", script: "zen.js" }
    ]);
}
