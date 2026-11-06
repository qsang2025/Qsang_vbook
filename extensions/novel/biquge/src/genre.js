// genre.js — danh sach the loai cua 笔趣阁 (biquge.tw).
// DU 8 the loai (lay tu nav /sort/, khao sat 2026-11-06):
// xuanhuan 玄幻魔法, wuxia 武侠修真, dushi 都市言情, lishi 历史军事,
// kehuan 科幻灵异, youxi 游戏竞技, nvsheng 女生耽美, qita 其他类型.
// Tien hiep / tu tien nam trong 武侠修真; vong du nam trong 游戏竞技.
// Moi muc tro ve book.js voi input /sort/<slug>/.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻魔法", input: "/sort/xuanhuan/", script: "book.js" },
        { title: "武侠修真", input: "/sort/wuxia/", script: "book.js" },
        { title: "都市言情", input: "/sort/dushi/", script: "book.js" },
        { title: "历史军事", input: "/sort/lishi/", script: "book.js" },
        { title: "科幻灵异", input: "/sort/kehuan/", script: "book.js" },
        { title: "游戏竞技", input: "/sort/youxi/", script: "book.js" },
        { title: "女生耽美", input: "/sort/nvsheng/", script: "book.js" },
        { title: "其他类型", input: "/sort/qita/", script: "book.js" }
    ]);
}
