// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 4 tab tinh (kiem chung live 2026-11-15): 最新更新 /newest/, 总排行榜
// /sort/, 穿越架空 /cyjk/, 玄幻魔法 /xhmf/. Tat ca deu la trang danh
// sach ul.clearfix li, gen.js xu ly.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute() {
    return Response.success([
        { title: "最新更新", input: "/newest/", script: "gen.js" },
        { title: "总排行榜", input: "/sort/", script: "gen.js" },
        { title: "穿越架空", input: "/cyjk/", script: "gen.js" },
        { title: "玄幻魔法", input: "/xhmf/", script: "gen.js" }
    ]);
}
