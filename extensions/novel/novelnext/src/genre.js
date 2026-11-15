// genre.js — danh sach the loai cua site.
// Danh sach co dinh trong bang GENRES (file helper.js) — lay tu nav
// dropdown cua trang chu (kiem chung live 2026-11-15, 54 the loai).
// 10 the loai nguoi lon da bi loc khoi bang: Adult, Mature, Smut,
// Ecchi, Yaoi, Yuri, Gender Bender, Shounen Ai, Shoujo Ai, Lgbt+;
// con 44 the loai. Manifest nsfw: true.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var genres = [];
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        genres.push({
            title: GENRES[i].title,
            input: GENRES[i].input,
            script: "gen.js"
        });
    }
    return Response.success(genres);
}
