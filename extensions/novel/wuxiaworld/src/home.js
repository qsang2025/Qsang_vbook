// home.js — 5 tab trang chu tinh, tro ve gen.js voi duong dan duyet.
// (Quy tac 9 AGENTS.md: home.js chi tra tab tinh, khong fetch.)
function execute() {
    return Response.success([
        { title: "Phổ biến", input: "/novels", script: "gen.js" },
        { title: "Mới nhất", input: "/novels?sort=new", script: "gen.js" },
        { title: "Nhiều chương nhất", input: "/novels?sort=chapters", script: "gen.js" },
        { title: "Đang ra", input: "/novels?status=ongoing", script: "gen.js" },
        { title: "Hoàn thành", input: "/novels?status=completed", script: "gen.js" }
    ]);
}
