// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
// 9 the loai tren trang chu (kiem chung live 2026-11-15):
// /sort/1_1/ 玄幻魔法, /sort/2_1/ 仙侠修真, /sort/3_1/ 都市言情,
// /sort/4_1/ 网游动漫, /sort/5_1/ 科幻小说, /sort/6_1/ 恐怖灵异,
// /sort/7_1/ 历史军事, /sort/8_1/ 其他小说, /sort/9_1/ 全本小说.
// Moi muc tro ve gen.js; trang N la /sort/<id>_<N>/.
// (Base cu xep sai thu tu: 4 la 网游动漫 chu khong phai 历史军事,
// 5 la 科幻小说, 6 la 恐怖灵异 — da sua theo trang live.)
function execute() {
    return Response.success([
        { title: "玄幻魔法", input: "/sort/1_1/", script: "gen.js" },
        { title: "仙侠修真", input: "/sort/2_1/", script: "gen.js" },
        { title: "都市言情", input: "/sort/3_1/", script: "gen.js" },
        { title: "网游动漫", input: "/sort/4_1/", script: "gen.js" },
        { title: "科幻小说", input: "/sort/5_1/", script: "gen.js" },
        { title: "恐怖灵异", input: "/sort/6_1/", script: "gen.js" },
        { title: "历史军事", input: "/sort/7_1/", script: "gen.js" },
        { title: "其他小说", input: "/sort/8_1/", script: "gen.js" },
        { title: "全本小说", input: "/sort/9_1/", script: "gen.js" }
    ]);
}
