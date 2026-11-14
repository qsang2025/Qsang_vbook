// genre.js — Danh sach the loai cua TruyenCv.
//
// API /story/genres/ tra 459 the loai theo nhom; nhom "the_loai" (16
// muc) la the loai chinh cua site — frontend tu chon
// genres.find(g => g.group === "the_loai"). API loi thi dung danh sach
// cung trong file config.js (GENRES, lay ngay 2026-11-14).
load("config.js");
load("rate-limit.js");

function execute() {
    var data = fetchJson(BASE_URL + "/story/genres/");
    var result = [];
    if (data && data.length > 0) {
        var i = 0;
        for (i = 0; i < data.length; i++) {
            var g = data[i];
            if (g.group !== "the_loai") continue;
            if (!g.slug || !g.name) continue;
            result.push({
                title: g.name,
                input: g.slug,
                script: "genrecontent.js"
            });
        }
    }
    if (result.length === 0) {
        var j = 0;
        for (j = 0; j < GENRES.length; j++) {
            result.push({
                title: GENRES[j][1],
                input: GENRES[j][0],
                script: "genrecontent.js"
            });
        }
    }
    return Response.success(result);
}
