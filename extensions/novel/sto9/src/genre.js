// genre.js — danh sach the loai cua 思兔閱讀 (sto9.com).
// DU 11 the loai (khao sat 2026-11-07, URL /novels/class/{id}_{page}.html):
// 0 全部分類, 1 玄幻奇幻, 2 武俠仙俠, 3 現代都市, 4 歷史軍事,
// 5 科幻小說, 6 遊戲競技, 7 恐怖靈異, 8 言情小說, 9 動漫同人,
// 10 其他類型.
// Moi muc tro ve book.js voi input /novels/class/{id}_1.html.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "全部分類", input: "/novels/class/0_1.html", script: "book.js" },
        { title: "玄幻奇幻", input: "/novels/class/1_1.html", script: "book.js" },
        { title: "武俠仙俠", input: "/novels/class/2_1.html", script: "book.js" },
        { title: "現代都市", input: "/novels/class/3_1.html", script: "book.js" },
        { title: "歷史軍事", input: "/novels/class/4_1.html", script: "book.js" },
        { title: "科幻小說", input: "/novels/class/5_1.html", script: "book.js" },
        { title: "遊戲競技", input: "/novels/class/6_1.html", script: "book.js" },
        { title: "恐怖靈異", input: "/novels/class/7_1.html", script: "book.js" },
        { title: "言情小說", input: "/novels/class/8_1.html", script: "book.js" },
        { title: "動漫同人", input: "/novels/class/9_1.html", script: "book.js" },
        { title: "其他類型", input: "/novels/class/10_1.html", script: "book.js" }
    ]);
}
