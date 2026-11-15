// home.js — cac tab trang chu (piaotia.com).
//
// Tab tinh, khong fetch (AGENTS.md muc 6.9). Moi tab tro ve gen.js voi
// input la duong dan danh sach: toan bo + 9 the loai + 4 bang xep hang
// (kiem chung live 2026-11-15: cac trang /booktop*/0/1.html cung mau
// table.grid nhu trang the loai).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "全部文章", input: "/booksort/0/1.html", script: "gen.js" },
        { title: "玄幻魔法", input: "/booksort1/0/1.html", script: "gen.js" },
        { title: "武侠修真", input: "/booksort2/0/1.html", script: "gen.js" },
        { title: "都市言情", input: "/booksort3/0/1.html", script: "gen.js" },
        { title: "历史军事", input: "/booksort4/0/1.html", script: "gen.js" },
        { title: "网游竞技", input: "/booksort5/0/1.html", script: "gen.js" },
        { title: "科幻小说", input: "/booksort6/0/1.html", script: "gen.js" },
        { title: "恐怖灵异", input: "/booksort7/0/1.html", script: "gen.js" },
        { title: "同人漫画", input: "/booksort8/0/1.html", script: "gen.js" },
        { title: "其他类型", input: "/booksort9/0/1.html", script: "gen.js" },
        { title: "总点击榜", input: "/booktopallvisit/0/1.html", script: "gen.js" },
        { title: "月点击榜", input: "/booktopmonthvisit/0/1.html", script: "gen.js" },
        { title: "最新入库", input: "/booktoppostdate/0/1.html", script: "gen.js" },
        { title: "最近更新", input: "/booktoplastupdate/0/1.html", script: "gen.js" }
    ]);
}
