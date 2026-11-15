// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 6 tab tinh (kiem chung live 2026-11-16): moi tab la 1 trang the loai
// cua site (/List/default.aspx?tid=<id>), app goi gen.js voi input do.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "魔幻", input: "https://book.sfacg.com/List/default.aspx?tid=21", script: "gen.js" },
        { title: "玄幻", input: "https://book.sfacg.com/List/default.aspx?tid=22", script: "gen.js" },
        { title: "科幻", input: "https://book.sfacg.com/List/default.aspx?tid=24", script: "gen.js" },
        { title: "都市", input: "https://book.sfacg.com/List/default.aspx?tid=26", script: "gen.js" },
        { title: "游戏", input: "https://book.sfacg.com/List/default.aspx?tid=27", script: "gen.js" },
        { title: "悬疑", input: "https://book.sfacg.com/List/default.aspx?tid=29", script: "gen.js" }
    ]);
}
