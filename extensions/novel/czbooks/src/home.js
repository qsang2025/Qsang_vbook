// home.js — cac tab trang chu cua 小說狂人 (czbooks.net).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan bang xep hang (mac dinh sort /day).
// 4 bang cua site: 精選排行 /c/normal, 人氣榜 /c/all, 完本榜 /c/finish,
// 收藏榜 /c/favorite. KHONG dua /c/hot (工口榜, NSFW) vao home mac dinh.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "精選排行", input: "/c/normal/day", script: "book.js" },
        { title: "人氣榜", input: "/c/all/day", script: "book.js" },
        { title: "完本榜", input: "/c/finish/day", script: "book.js" },
        { title: "收藏榜", input: "/c/favorite/day", script: "book.js" }
    ]);
}
