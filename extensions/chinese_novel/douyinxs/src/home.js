// home.js — Tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md
// muc 6.9). 6 the loai chinh cua site (kiem chung live 2026-11-15
// tren nav .sortChannel_nav): 全部分类 /fenlei/, 玄奇 /fenlei/1/1/,
// 高武 /fenlei/2/1/, 修仙 /fenlei/3/1/, 都市 /fenlei/4/1/,
// 科幻 /fenlei/8/1/. Moi tab tro ve gen.js. 5 the loai con lai
// (5 军事, 6 历史, 7 游体, 9 恐怖, 10 次元, 11 女生) nam o genre.js.
function execute() {
    return Response.success([
        { title: "全部分类", input: "/fenlei/", script: "gen.js" },
        { title: "玄奇", input: "/fenlei/1/1/", script: "gen.js" },
        { title: "高武", input: "/fenlei/2/1/", script: "gen.js" },
        { title: "修仙", input: "/fenlei/3/1/", script: "gen.js" },
        { title: "都市", input: "/fenlei/4/1/", script: "gen.js" },
        { title: "科幻", input: "/fenlei/8/1/", script: "gen.js" }
    ]);
}
