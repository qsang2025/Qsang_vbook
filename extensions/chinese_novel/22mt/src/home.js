// home.js — Tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md
// muc 6.9). 4 muc cua site (kiem chung live 2026-11-15, tat ca tra 200):
// /lastupdate/ 最新更新, /lastpost/ 最新入库, /top/ 排行榜,
// /full/ 完本. Moi tab tro ve gen.js.
function execute() {
    return Response.success([
        { title: "最新更新", input: "/lastupdate/", script: "gen.js" },
        { title: "最新入库", input: "/lastpost/", script: "gen.js" },
        { title: "排行榜", input: "/top/", script: "gen.js" },
        { title: "完本", input: "/full/", script: "gen.js" }
    ]);
}
