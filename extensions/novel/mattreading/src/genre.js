// genre.js — danh sach truyen cua site (site chi co 8 truyen, moi truyen
// la 1 "the loai": chon truyen se hien muc luc chuong cua truyen do).
// Danh sach co dinh trong bang NOVELS (file helper.js) — site nho va
// on dinh, khong can fetch trang /novels/ moi lan.
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
    for (i = 0; i < NOVELS.length; i++) {
        genres.push({
            title: NOVELS[i].title + " (" + NOVELS[i].status + ")",
            input: NOVELS[i].url,
            script: "gen.js"
        });
    }
    return Response.success(genres);
}
