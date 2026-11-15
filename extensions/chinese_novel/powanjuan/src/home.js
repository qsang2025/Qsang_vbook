// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 6 tab tinh (kiem chung live 2026-11-16): trang chu dung bo cuc
// .books div.bk (gen.js); cac trang the loai dung bo cuc
// ul.clearfix li (zen.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "首页", input: "/", script: "gen.js" },
        { title: "同人小说", input: "/tongren/", script: "zen.js" },
        { title: "玄幻奇幻", input: "/wxxz/", script: "zen.js" },
        { title: "科幻魔法", input: "/khjj/", script: "zen.js" },
        { title: "都市情感", input: "/dsyq/", script: "zen.js" },
        { title: "总排行榜", input: "/sort/", script: "zen.js" }
    ]);
}
