// genre.js — Danh sach the loai TruyenC
load('config.js');

function execute() {
    var items = [];
    for (var i = 0; i < GENRES.length; i++) {
        items.push({
            title: GENRES[i].title,
            input: GENRES[i].slug,
            script: "gen.js"
        });
    }
    return Response.success(items);
}
