// home.js — Tab tinh tren trang chu (khong fetch, theo quy tac 9 AGENTS.md).
load("config.js");
function execute() {
    return Response.success([
        { title: "Nổi Bật", input: "/novel/hot", script: "homecontent.js" },
        { title: "男頻閱讀榜", input: "男頻閱讀榜", script: "rankcontent.js" },
        { title: "女頻新書榜", input: "女頻新書榜", script: "rankcontent.js" },
        { title: "男頻新書榜", input: "男頻新書榜", script: "rankcontent.js" },
        { title: "女頻閱讀榜", input: "女頻閱讀榜", script: "rankcontent.js" }
    ]);
}
