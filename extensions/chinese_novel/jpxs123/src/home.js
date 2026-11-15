// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 4 tab tinh (kiem chung live 2026-11-15): 精品小說 /book/, 排行榜
// /hot/, 同人小說 /tongren/, 玄幻修真 /xh/. Tat ca deu la trang danh
// sach div.bk, gen.js xu ly.
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
        { title: "精品小說", input: "/book/", script: "gen.js" },
        { title: "排行榜", input: "/hot/", script: "gen.js" },
        { title: "同人小說", input: "/tongren/", script: "gen.js" },
        { title: "玄幻修真", input: "/xh/", script: "gen.js" }
    ]);
}
