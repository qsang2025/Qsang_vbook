// genre.js — Danh sach the loai TruyenHD (truyenhdc.com).
//
// 34 the loai lay tu GENRES trong file config.js (kiem chung live
// 2026-11-14 tu nav trang chu + bo loc trang the loai). Moi muc tro
// ve gen.js voi input la duong dan /keyword/<slug> — gen.js goi API
// danh sach cua site (trang the loai khong co SSR).
load("config.js");

function execute() {
    var genres = [];
    for (var i = 0; i < GENRES.length; i++) {
        genres.push({
            title: GENRES[i].title,
            input: "/keyword/" + GENRES[i].slug,
            script: "gen.js"
        });
    }
    return Response.success(genres);
}
