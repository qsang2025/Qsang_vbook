// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
// 10 the loai tren trang chu (kiem chung live 2026-11-15):
// /leibie1_1.html 玄幻魔法 ... /leibie10_1.html 其他类型.
// Moi muc tro ve gen.js; trang N la /leibie<N>_<M>.html.
function execute() {
    return Response.success([
        { title: "玄幻魔法", input: "/leibie1_1.html", script: "gen.js" },
        { title: "武侠修真", input: "/leibie2_1.html", script: "gen.js" },
        { title: "都市言情", input: "/leibie3_1.html", script: "gen.js" },
        { title: "历史军事", input: "/leibie4_1.html", script: "gen.js" },
        { title: "侦探推理", input: "/leibie5_1.html", script: "gen.js" },
        { title: "网游动漫", input: "/leibie6_1.html", script: "gen.js" },
        { title: "科幻小说", input: "/leibie7_1.html", script: "gen.js" },
        { title: "恐怖灵异", input: "/leibie8_1.html", script: "gen.js" },
        { title: "散文诗词", input: "/leibie9_1.html", script: "gen.js" },
        { title: "其他类型", input: "/leibie10_1.html", script: "gen.js" }
    ]);
}
