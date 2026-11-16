// genre.js — Danh sach the loai tinh (khong fetch). 40 muc, id so tu JS
// cua site (xem bang GENRE_LIST trong file helper.js). Moi muc tro ve
// gen.js voi URL /en/novel-list?genre=<id> (loc bang id so — slug khong
// co tac dung, da kiem chung genre=5 va genre=35).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('helper.js');

function execute() {
    var out = [];
    var i = 0;
    for (i = 0; i < GENRE_LIST.length; i++) {
        var g = GENRE_LIST[i];
        var title = g.slug.charAt(0).toUpperCase() + g.slug.substring(1);
        out.push({
            title: title,
            input: BASE_URL + "/en/novel-list?genre=" + g.id,
            script: "gen.js"
        });
    }
    return Response.success(out);
}
