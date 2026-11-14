// home.js — Tab tinh trang chu (khong fetch, theo quy tac 9 AGENTS.md).
load("config.js");

function execute() {
    return Response.success([
        { title: "Truyện Hoàn Thành", input: BASE_URL + "/hoan-thanh.html", script: "gen.js" },
        { title: "Truyện Chờ Full", input: BASE_URL + "/truyen-cho-full.html", script: "gen.js" }
    ]);
}
