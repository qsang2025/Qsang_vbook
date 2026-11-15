// genre.js — Danh sach the loai (execute() -> 15 muc).
//
// 15 the loai lay tu /fenlei/ (kiem chung live 2026-11-15, kem so luong
// truyen). Danh sach cung co trong file helper.js (GENRES) de detail.js
// doi ten the loai thanh duong dan.
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
    var out = [];
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        out.push({ title: GENRES[i].title, input: GENRES[i].input, script: "gen.js" });
    }
    return Response.success(out);
}
