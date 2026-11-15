// genre.js — danh sach the loai (tab tinh, khong fetch).
//
// 11 the loai cua site (kiem chung live 2026-11-16 tu nav "小說分類":
// /booklists/<id>/); moi muc tro ve gen.js.
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
        out.push({ title: GENRES[i].title, input: "https://www.8book.com" + GENRES[i].input, script: "gen.js" });
    }
    return Response.success(out);
}
