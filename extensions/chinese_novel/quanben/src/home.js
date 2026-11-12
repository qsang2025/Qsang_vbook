// home.js — Cac tab trang chu QuanBen (quanben5.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// 6 the loai doc nhieu nhat; moi tab tro ve book.js voi trang 1 cua
// the loai do (/category/<N>.html). Du the loai: mo tab "Thể loại" (genre.js).
function execute() {
    return Response.success([
        { title: "玄幻", input: "/category/1.html", script: "book.js" },
        { title: "都市", input: "/category/2.html", script: "book.js" },
        { title: "仙侠", input: "/category/3.html", script: "book.js" },
        { title: "言情", input: "/category/5.html", script: "book.js" },
        { title: "穿越", input: "/category/6.html", script: "book.js" },
        { title: "历史", input: "/category/14.html", script: "book.js" }
    ]);
}
