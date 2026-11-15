// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 6 tab tinh tro ve gen.js voi id so cua API book_list_data (kiem chung
// live 2026-11-16, 10 truyen/trang, phan trang theo so trang).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "全部", input: "0", script: "gen.js" },
        { title: "玄幻奇幻", input: "8", script: "gen.js" },
        { title: "都市青春", input: "27", script: "gen.js" },
        { title: "科幻无限", input: "6", script: "gen.js" },
        { title: "免费同人", input: "24", script: "gen.js" },
        { title: "女频", input: "11", script: "gen.js" }
    ]);
}
