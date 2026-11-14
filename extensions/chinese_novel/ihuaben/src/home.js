// home.js — Tab tinh trang chu (khong fetch, theo quy tac 9 AGENTS.md).
load("config.js");

function execute() {
    return Response.success([
        { title: "Trending", input: BASE_URL, script: "homecontent.js" }
    ]);
}
