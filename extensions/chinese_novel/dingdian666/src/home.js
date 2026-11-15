// home.js — Tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md
// muc 6.9). 6 the loai chinh cua site (kiem chung live 2026-11-15
// tren trang chu, tat ca tra 200): /sort/1_1/ 玄幻魔法,
// /sort/2_1/ 仙侠修真, /sort/3_1/ 都市言情, /sort/4_1/ 网游动漫,
// /sort/5_1/ 科幻小说, /sort/6_1/ 恐怖灵异. Moi tab tro ve gen.js.
// 3 the loai con lai (7 历史军事, 8 其他小说, 9 全本小说) nam o
// genre.js.
function execute() {
    return Response.success([
        { title: "玄幻魔法", input: "/sort/1_1/", script: "gen.js" },
        { title: "仙侠修真", input: "/sort/2_1/", script: "gen.js" },
        { title: "都市言情", input: "/sort/3_1/", script: "gen.js" },
        { title: "网游动漫", input: "/sort/4_1/", script: "gen.js" },
        { title: "科幻小说", input: "/sort/5_1/", script: "gen.js" },
        { title: "恐怖灵异", input: "/sort/6_1/", script: "gen.js" }
    ]);
}
