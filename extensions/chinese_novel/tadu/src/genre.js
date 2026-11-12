// genre.js — danh sach the loai cua Tadu (tinh, khong fetch).
// 10 the loai nam + nu (122) + xuat ban (79) + nhi nguyen (270) +
// truyen ngan (281); id lay tu link loc tren trang store (kiem chung
// live 2026-11-12). Tro ve book.js voi input la id the loai.
function execute() {
    return Response.success([
        { title: "东方玄幻", input: "99", script: "book.js" },
        { title: "现代都市", input: "103", script: "book.js" },
        { title: "脑洞创意", input: "135", script: "book.js" },
        { title: "历史架空", input: "108", script: "book.js" },
        { title: "军事战争", input: "113", script: "book.js" },
        { title: "游戏竞技", input: "112", script: "book.js" },
        { title: "武侠仙侠", input: "109", script: "book.js" },
        { title: "科幻末世", input: "111", script: "book.js" },
        { title: "灵异悬疑", input: "128", script: "book.js" },
        { title: "西方奇幻", input: "107", script: "book.js" },
        { title: "女频", input: "122", script: "book.js" },
        { title: "出版", input: "79", script: "book.js" },
        { title: "二次元", input: "270", script: "book.js" },
        { title: "短篇小说", input: "281", script: "book.js" }
    ]);
}
