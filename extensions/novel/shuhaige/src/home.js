// home.js — cac tab trang chu cua 书海阁 (shuhaige.tw).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan danh sach. Ba tab dau: tong click, moi cap nhat,
// da hoan thanh; sau do 6 the loai lon.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "总点击", input: "/allvisit/", script: "book.js" },
        { title: "最新更新", input: "/lastupdate/", script: "book.js" },
        { title: "已完结", input: "/quanben/", script: "book.js" },
        { title: "玄幻奇幻", input: "/xuanhuan/", script: "book.js" },
        { title: "武侠仙侠", input: "/wuxia/", script: "book.js" },
        { title: "都市生活", input: "/dushi/", script: "book.js" },
        { title: "历史军事", input: "/lishi/", script: "book.js" },
        { title: "科幻未来", input: "/kehuan/", script: "book.js" },
        { title: "游戏竞技", input: "/youxi/", script: "book.js" }
    ]);
}
