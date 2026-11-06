// genre.js — danh sach the loai cua Hoat Hinh AI Trung Quoc (Dailymotion).
// Danh sach TINH 4 muc theo tu khoa da chon san (khao sat 2026-11-06,
// explorer_r1_3 muc 1.5). Moi muc tro ve search.js voi input la tu khoa.
// Khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute() {
    var genres = [];
    var i = 0;
    for (i = 0; i < CURATED_QUERIES.length; i++) {
        genres.push({
            title: CURATED_QUERIES[i].title,
            input: CURATED_QUERIES[i].input,
            script: "search.js"
        });
    }
    return Response.success(genres);
}
