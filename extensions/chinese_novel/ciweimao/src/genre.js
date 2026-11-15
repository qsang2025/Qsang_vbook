// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
//
// 10 muc: tat ca + 9 the loai song (kiem chung live tu trang
// /index/category + API book_list_data 2026-11-16). Input la id so
// cua API, gen.js dung de goi /index/book_list_data.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "全部", input: "0", script: "gen.js" },
        { title: "玄幻奇幻", input: "8", script: "gen.js" },
        { title: "都市青春", input: "27", script: "gen.js" },
        { title: "灵异未知", input: "1", script: "gen.js" },
        { title: "历史军事", input: "30", script: "gen.js" },
        { title: "科幻无限", input: "6", script: "gen.js" },
        { title: "游戏竞技", input: "3", script: "gen.js" },
        { title: "仙侠武侠", input: "5", script: "gen.js" },
        { title: "免费同人", input: "24", script: "gen.js" },
        { title: "女频", input: "11", script: "gen.js" }
    ]);
}
