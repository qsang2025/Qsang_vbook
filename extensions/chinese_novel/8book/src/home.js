// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 6 tab tinh (kiem chung live 2026-11-16): moi tab la 1 trang danh sach
// cua site (/booklists/...), app goi gen.js voi input do.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "新書入庫", input: "https://www.8book.com/booklists/newrelease/", script: "gen.js" },
        { title: "最新更新", input: "https://www.8book.com/booklists/update/", script: "gen.js" },
        { title: "熱門排行", input: "https://www.8book.com/booklists/rank/", script: "gen.js" },
        { title: "全本小說", input: "https://www.8book.com/booklists/finish/", script: "gen.js" },
        { title: "小說大全", input: "https://www.8book.com/booklists/list/all_all_all/", script: "gen.js" },
        { title: "仙俠武俠", input: "https://www.8book.com/booklists/2/", script: "gen.js" }
    ]);
}
