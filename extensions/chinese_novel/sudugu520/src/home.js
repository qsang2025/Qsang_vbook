// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 4 tab tinh (kiem chung live 2026-11-15): 最新更新 /zuixin/,
// 排行榜 /paihang/, 完结小说 /wanjie/, 玄幻小说 /xuanhuan/.
// Tat ca deu la trang danh sach div.item, gen.js xu ly.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    return Response.success([
        { title: "最新更新", input: "/zuixin/", script: "gen.js" },
        { title: "排行榜", input: "/paihang/", script: "gen.js" },
        { title: "完结小说", input: "/wanjie/", script: "gen.js" },
        { title: "玄幻小说", input: "/xuanhuan/", script: "gen.js" }
    ]);
}
