// home.js — Tab điều hướng chính cho Qimao (七猫免费小说)
// Theo AGENTS.md mục 6.9: home.js chỉ trả tab tĩnh, không fetch HTTP.

function execute() {
    return Response.success([
        { title: "男频人气", input: "0-a-a-a-a-a-a-click", script: "gen.js" },
        { title: "女频人气", input: "1-a-a-a-a-a-a-click", script: "gen.js" },
        { title: "最新入库", input: "a-a-a-a-a-a-a-update_time", script: "gen.js" },
        { title: "出版图书", input: "2-a-a-a-a-a-a-click", script: "gen.js" },
        { title: "男频最新", input: "0-a-a-a-a-a-a-update_time", script: "gen.js" },
        { title: "女频最新", input: "1-a-a-a-a-a-a-update_time", script: "gen.js" }
    ]);
}
