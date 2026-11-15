// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
// 8 the loai tren nav (ten THAT lay tu <title> moi trang /list/N.html,
// kiem chung live 2026-11-15 — nhan nav cu "武侠" o /list/2.html la
// SAI, ten that la 修真): 1 玄幻, 2 修真, 3 都市, 4 历史, 5 网游,
// 6 科幻, 7 言情, 8 其它. Moi muc tro ve gen.js;
// trang N la /list/<id>/<N>.html.
function execute() {
    return Response.success([
        { title: "玄幻", input: "/list/1.html", script: "gen.js" },
        { title: "修真", input: "/list/2.html", script: "gen.js" },
        { title: "都市", input: "/list/3.html", script: "gen.js" },
        { title: "历史", input: "/list/4.html", script: "gen.js" },
        { title: "网游", input: "/list/5.html", script: "gen.js" },
        { title: "科幻", input: "/list/6.html", script: "gen.js" },
        { title: "言情", input: "/list/7.html", script: "gen.js" },
        { title: "其它", input: "/list/8.html", script: "gen.js" }
    ]);
}
