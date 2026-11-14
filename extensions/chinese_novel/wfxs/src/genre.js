// genre.js — danh sach the loai (wfxs.tw).
// 10 muc lay tu thanh nav tren trang chu (kiem chung live 2026-11-14):
// 豪門, 靈異, 青春, 玄幻, 架空, 異能, 都市, 類型, 現代, 古代.
// Moi muc tro ve search.js voi input la duong dan the loai; trang the loai
// dung markup .shuku_list .shulist (khac trang top), 20 truyen/trang,
// phan trang /<slug>/<n>/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "豪門", input: "/haomenzongcai/", script: "search.js" },
        { title: "靈異", input: "/xuanyilingyi/", script: "search.js" },
        { title: "青春", input: "/langmanqingchun/", script: "search.js" },
        { title: "玄幻", input: "/xianxiaxuanhuan/", script: "search.js" },
        { title: "架空", input: "/chuanyuejiakong/", script: "search.js" },
        { title: "異能", input: "/dushiyineng/", script: "search.js" },
        { title: "都市", input: "/dushiyanqing/", script: "search.js" },
        { title: "類型", input: "/qita/", script: "search.js" },
        { title: "現代", input: "/xianyan/", script: "search.js" },
        { title: "古代", input: "/guyan/", script: "search.js" }
    ]);
}
