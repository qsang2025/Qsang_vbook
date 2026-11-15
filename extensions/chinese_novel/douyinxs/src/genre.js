// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
// 12 muc tren nav .sortChannel_nav cua trang /fenlei/
// (kiem chung live 2026-11-15): 全部分类 /fenlei/, 玄奇 /fenlei/1/1/,
// 高武 /fenlei/2/1/, 修仙 /fenlei/3/1/, 都市 /fenlei/4/1/,
// 军事 /fenlei/5/1/, 历史 /fenlei/6/1/, 游体 /fenlei/7/1/,
// 科幻 /fenlei/8/1/, 恐怖 /fenlei/9/1/, 次元 /fenlei/10/1/,
// 女生 /fenlei/11/1/. Moi muc tro ve gen.js; trang N cua the loai
// la /fenlei/<id>_<N>/.
// (Base cu sai: 次元 ghi /fenlei/0/, 女生 ghi /fenlei/, cac the loai
// khac ghi /fenlei/<id>/ (la trang cua danh sach tat ca, khong phai
// trang 1 cua the loai) — da sua theo trang live.)
function execute() {
    return Response.success([
        { title: "全部分类", input: "/fenlei/", script: "gen.js" },
        { title: "玄奇", input: "/fenlei/1/1/", script: "gen.js" },
        { title: "高武", input: "/fenlei/2/1/", script: "gen.js" },
        { title: "修仙", input: "/fenlei/3/1/", script: "gen.js" },
        { title: "都市", input: "/fenlei/4/1/", script: "gen.js" },
        { title: "军事", input: "/fenlei/5/1/", script: "gen.js" },
        { title: "历史", input: "/fenlei/6/1/", script: "gen.js" },
        { title: "游体", input: "/fenlei/7/1/", script: "gen.js" },
        { title: "科幻", input: "/fenlei/8/1/", script: "gen.js" },
        { title: "恐怖", input: "/fenlei/9/1/", script: "gen.js" },
        { title: "次元", input: "/fenlei/10/1/", script: "gen.js" },
        { title: "女生", input: "/fenlei/11/1/", script: "gen.js" }
    ]);
}
