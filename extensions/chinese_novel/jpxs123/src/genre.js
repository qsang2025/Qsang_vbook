// genre.js — Danh sach the loai (execute() -> 8 muc).
//
// 8 the loai lay tu nav trang chu (kiem chung live 2026-11-15).
// Danh sach cung co trong file helper.js (CATEGORIES) de detail.js
// doi slug the loai thanh ten.
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
    var out = [];
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        out.push({ title: CATEGORIES[i].title, input: CATEGORIES[i].input, script: "gen.js" });
    }
    return Response.success(out);
}
