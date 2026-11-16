// genre.js — Danh sach the loai (execute() -> 23 tag).
// Tag lay tu GENRES (file helper.js) — 23 tag tren trang chu, kiem chung
// live 2026-11-16: ca 23 URL /tags-<id>-0.html deu tra 200. Moi tag mo
// qua gen.js (phan trang /tags-<id>-<n>.html).
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
    var out = [];
    for (var i = 0; i < GENRES.length; i++) {
        out.push({ title: GENRES[i].title, input: GENRES[i].input, script: "gen.js" });
    }
    return Response.success(out);
}
