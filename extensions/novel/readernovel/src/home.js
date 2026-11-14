// home.js — 3 tab trang chu tinh, tro ve gen.js voi duong dan danh sach.
// (Quy tac 9 AGENTS.md: home.js chi tra tab tinh, khong fetch.)
function execute() {
    return Response.success([
        { title: "Latest", input: "/browse?sort=date&status=0", script: "gen.js" },
        { title: "Popular", input: "/browse?sort=popular&status=0", script: "gen.js" },
        { title: "A-Z", input: "/browse?sort=name&status=0", script: "gen.js" }
    ]);
}
