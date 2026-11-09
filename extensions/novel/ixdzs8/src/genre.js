// genre.js — danh sach the loai cua 爱下电子书 (ixdzs8.com).
// DU 15 the loai (khao sat 2026-11-09, URL /sort/{id}/):
// 0 其他小说, 1 玄幻奇幻, 2 修真仙侠, 3 都市青春, 4 军事历史,
// 5 网游竞技, 6 科幻灵异, 7 言情穿越, 8 耽美同人, 9 台言古言,
// 10 武侠小说, 11 古典文学, 12 侦探推理, 13 外国文学, 14 当代现代.
// Moi muc tro ve book.js voi input /sort/{id}/.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "其他小说", input: "/sort/0/", script: "book.js" },
        { title: "玄幻奇幻", input: "/sort/1/", script: "book.js" },
        { title: "修真仙侠", input: "/sort/2/", script: "book.js" },
        { title: "都市青春", input: "/sort/3/", script: "book.js" },
        { title: "军事历史", input: "/sort/4/", script: "book.js" },
        { title: "网游竞技", input: "/sort/5/", script: "book.js" },
        { title: "科幻灵异", input: "/sort/6/", script: "book.js" },
        { title: "言情穿越", input: "/sort/7/", script: "book.js" },
        { title: "耽美同人", input: "/sort/8/", script: "book.js" },
        { title: "台言古言", input: "/sort/9/", script: "book.js" },
        { title: "武侠小说", input: "/sort/10/", script: "book.js" },
        { title: "古典文学", input: "/sort/11/", script: "book.js" },
        { title: "侦探推理", input: "/sort/12/", script: "book.js" },
        { title: "外国文学", input: "/sort/13/", script: "book.js" },
        { title: "当代现代", input: "/sort/14/", script: "book.js" }
    ]);
}
