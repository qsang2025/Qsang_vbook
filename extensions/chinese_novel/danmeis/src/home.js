// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 6 danh muc chinh + 3 bang xep hang (kiem chung live 2026-11-16:
// /top_allvisit/ click, /top_goodnum/ collect, /top_allvote/ recommend
// deu dung bo cuc ul.j_bookList nhu trang the loai).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻奇幻", input: "https://www.danmeis.com/xuanhuan", script: "gen.js" },
        { title: "武侠仙侠", input: "https://www.danmeis.com/wuxia", script: "gen.js" },
        { title: "历史军事", input: "https://www.danmeis.com/lishi", script: "gen.js" },
        { title: "都市生活", input: "https://www.danmeis.com/dushi", script: "gen.js" },
        { title: "科幻未来", input: "https://www.danmeis.com/kehuan", script: "gen.js" },
        { title: "其他类型", input: "https://www.danmeis.com/qita", script: "gen.js" },
        { title: "点击榜", input: "https://www.danmeis.com/top_allvisit/", script: "gen.js" },
        { title: "收藏榜", input: "https://www.danmeis.com/top_goodnum/", script: "gen.js" },
        { title: "推荐榜", input: "https://www.danmeis.com/top_allvote/", script: "gen.js" }
    ]);
}
