// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 4 tab tinh (kiem chung live 2026-11-16): 最新更新 / (trang chu,
// #newscontent 60 truyen "最近更新"), 排行榜 /rank/allvisit/ (30 truyen,
// dang div.item), 玄幻小说 /list/xuanhuanmofa/1.html, 仙侠小说
// /list/xianxiaxiuzhen/1.html. Tat ca deu do gen.js xu ly.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute() {
    return Response.success([
        { title: "最新更新", input: "/", script: "gen.js" },
        { title: "排行榜", input: "/rank/allvisit/", script: "gen.js" },
        { title: "玄幻小说", input: "/list/xuanhuanmofa/1.html", script: "gen.js" },
        { title: "仙侠小说", input: "/list/xianxiaxiuzhen/1.html", script: "gen.js" }
    ]);
}
