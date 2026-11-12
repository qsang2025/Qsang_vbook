// home.js — tab tinh cua Tadu (khong fetch, theo quy tac nha 6.9).
// 10 the loai nam chinh cua site, tro ve book.js voi input la id the loai.
// Id the loai lay tu link loc tren trang store (kiem chung live 2026-11-12).
function execute() {
    return Response.success([
        { title: "东方玄幻", input: "99", script: "book.js" },
        { title: "现代都市", input: "103", script: "book.js" },
        { title: "脑洞创意", input: "135", script: "book.js" },
        { title: "历史架空", input: "108", script: "book.js" },
        { title: "军事战争", input: "113", script: "book.js" },
        { title: "游戏竞技", input: "112", script: "book.js" },
        { title: "武侠仙侠", input: "109", script: "book.js" },
        { title: "科幻末世", input: "111", script: "book.js" },
        { title: "灵异悬疑", input: "128", script: "book.js" },
        { title: "西方奇幻", input: "107", script: "book.js" }
    ]);
}
