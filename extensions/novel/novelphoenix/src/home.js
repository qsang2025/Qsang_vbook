// home.js — 5 tab trang chu tinh, tro ve gen.js voi duong dan danh sach.
// (Quy tac 9 AGENTS.md: home.js chi tra tab tinh, khong fetch.)
function execute() {
    return Response.success([
        { title: "Latest Release", input: "/latest-release-novel", script: "gen.js" },
        { title: "Newly Added", input: "/new-novel", script: "gen.js" },
        { title: "Hot Novel", input: "/hot-novel", script: "gen.js" },
        { title: "Most Popular", input: "/most-popular", script: "gen.js" },
        { title: "Completed", input: "/completed-novel", script: "gen.js" }
    ]);
}
