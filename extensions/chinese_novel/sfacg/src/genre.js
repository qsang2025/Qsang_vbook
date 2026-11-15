// genre.js — danh sach the loai (tab tinh, khong fetch).
//
// 9 the loai cua site (kiem chung live 2026-11-16: cac tid 21–29 xuat
// hien tren trang chi tiet + trang chu; moi muc tro ve gen.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "魔幻", input: "https://book.sfacg.com/List/default.aspx?tid=21", script: "gen.js" },
        { title: "玄幻", input: "https://book.sfacg.com/List/default.aspx?tid=22", script: "gen.js" },
        { title: "古风", input: "https://book.sfacg.com/List/default.aspx?tid=23", script: "gen.js" },
        { title: "科幻", input: "https://book.sfacg.com/List/default.aspx?tid=24", script: "gen.js" },
        { title: "校园", input: "https://book.sfacg.com/List/default.aspx?tid=25", script: "gen.js" },
        { title: "都市", input: "https://book.sfacg.com/List/default.aspx?tid=26", script: "gen.js" },
        { title: "游戏", input: "https://book.sfacg.com/List/default.aspx?tid=27", script: "gen.js" },
        { title: "同人", input: "https://book.sfacg.com/List/default.aspx?tid=28", script: "gen.js" },
        { title: "悬疑", input: "https://book.sfacg.com/List/default.aspx?tid=29", script: "gen.js" }
    ]);
}
