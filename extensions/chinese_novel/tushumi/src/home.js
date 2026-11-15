// home.js — Tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md
// muc 6.9). 5 bang cua site (kiem chung live 2026-11-15, tat ca tra 200):
// /lastupdate/ 今日更新, /postdate/ 上架新书, /monthvisit/ 月点击榜,
// /goodnum/ 总收藏榜, /goodnew/ 新书榜单. Moi tab tro ve gen.js.
function execute() {
    return Response.success([
        { title: "最近更新", input: "/lastupdate/", script: "gen.js" },
        { title: "最新入库", input: "/postdate/", script: "gen.js" },
        { title: "月点击", input: "/monthvisit/", script: "gen.js" },
        { title: "总收藏", input: "/goodnum/", script: "gen.js" },
        { title: "新书榜", input: "/goodnew/", script: "gen.js" }
    ]);
}
