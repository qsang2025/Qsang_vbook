// home.js — 10 tab the loai tinh, tro ve search.js voi duong dan /list_N/.
// (Quy tac 9 AGENTS.md: home.js chi tra tab tinh, khong fetch.)
function execute() {
    return Response.success([
        { title: "玄幻", input: "/list_1/", script: "search.js" },
        { title: "武侠", input: "/list_2/", script: "search.js" },
        { title: "都市", input: "/list_3/", script: "search.js" },
        { title: "历史", input: "/list_4/", script: "search.js" },
        { title: "科幻", input: "/list_5/", script: "search.js" },
        { title: "游戏", input: "/list_6/", script: "search.js" },
        { title: "恐怖", input: "/list_7/", script: "search.js" },
        { title: "言情", input: "/list_8/", script: "search.js" },
        { title: "同人", input: "/list_9/", script: "search.js" },
        { title: "其他", input: "/list_10/", script: "search.js" }
    ]);
}
