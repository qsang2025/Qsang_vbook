// genre.js — danh sach the loai cua 繁體小說 (novels.com.tw).
// Danh sach DU 13 the loai (map ID lay tu nav trang chu, khao sat 2026-11-06):
// 1 玄幻魔法, 2 武俠修真, 3 都市言情, 4 曆史軍事, 5 科幻靈異,
// 6 遊戲競技, 7 女生耽美, 9 其他類型, 10 短篇,
// 11 成人小說, 12 肉文小說, 13 精肉小說.
// ID 8 KHONG ton tai (/nosort/8/ tra ve trang tat ca).
// 11/12/13 la the loai nguoi lon — GIU LAI DU theo yeu cau truc tiep cua
// nguoi dung ngay 2026-11-06 (dao nguoc chi dan loai bo ban dau).
// Moi muc tro ve book.js voi input /nosort/<N>/1/.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻魔法", input: "/nosort/1/1/", script: "book.js" },
        { title: "武俠修真", input: "/nosort/2/1/", script: "book.js" },
        { title: "都市言情", input: "/nosort/3/1/", script: "book.js" },
        { title: "曆史軍事", input: "/nosort/4/1/", script: "book.js" },
        { title: "科幻靈異", input: "/nosort/5/1/", script: "book.js" },
        { title: "遊戲競技", input: "/nosort/6/1/", script: "book.js" },
        { title: "女生耽美", input: "/nosort/7/1/", script: "book.js" },
        { title: "其他類型", input: "/nosort/9/1/", script: "book.js" },
        { title: "短篇", input: "/nosort/10/1/", script: "book.js" },
        { title: "成人小說", input: "/nosort/11/1/", script: "book.js" },
        { title: "肉文小說", input: "/nosort/12/1/", script: "book.js" },
        { title: "精肉小說", input: "/nosort/13/1/", script: "book.js" }
    ]);
}
