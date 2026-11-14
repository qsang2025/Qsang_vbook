// genre.js — Danh sach the loai tinh cua Me Truyen Sang Tac.
// 130 the loai lay tu trang chu ngay 2026-11-14 (file config.js, bien
// GENRES). Ca 3 muc trang thai (1 Con tiep, 11 Hoan thanh, 59 Tam dung)
// cung la the loai tren chinh site.
load("config.js");

function execute() {
    var result = [];
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        result.push({
            title: GENRES[i][1],
            input: String(GENRES[i][0]),
            script: "genrecontent.js"
        });
    }
    return Response.success(result);
}
