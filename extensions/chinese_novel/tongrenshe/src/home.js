// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 4 tab tinh (kiem chung live 2026-11-16): 最新同人 /tongren/,
// 排行榜单 /hot/, 全本同人 /tags-150-0.html, 连载同人
// /tags-151-0.html. Tat ca deu la trang danh sach div.bk,
// gen.js xu ly.
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
        { title: "最新同人", input: "/tongren/", script: "gen.js" },
        { title: "排行榜单", input: "/hot/", script: "gen.js" },
        { title: "全本同人", input: "/tags-150-0.html", script: "gen.js" },
        { title: "连载同人", input: "/tags-151-0.html", script: "gen.js" }
    ]);
}
