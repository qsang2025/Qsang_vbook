// home.js — 3 tab trang chu tinh, tro ve gen.js voi duong dan danh sach.
// (Quy tac 9 AGENTS.md: home.js chi tra tab tinh, khong fetch.)
function execute() {
    return Response.success([
        { title: "Most Popular", input: "/list/all/all-onclick-0.html", script: "gen.js" },
        { title: "New Novels", input: "/list/all/all-newstime-0.html", script: "gen.js" },
        { title: "Recently Updated", input: "/list/all/all-lastdotime-0.html", script: "gen.js" }
    ]);
}
