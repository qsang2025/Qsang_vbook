// genre.js — Danh sach the loai (tinh, doc tu nav + muc 分类 tren
// trang chu, kiem chung live 2026-11-16: /aggregation/2..19).
// 18 the loai, tat ca deu la ten the loai chung (khong co the loai nao
// mang ten 18+ de loc — tinh 18+ nam o noi dung truyen, xem mo ta
// plugin.json). Moi the loai tro ve gen.js.
load('config.js');

function execute() {
    var g = [
        ["社会", 2], ["豪门", 3], ["现代", 4], ["古代", 5],
        ["穿越", 6], ["玄幻", 7], ["悬疑", 8], ["武侠", 9],
        ["短篇小说", 10], ["历史军事", 11], ["恐怖小说", 12],
        ["同人美文", 13], ["科幻小说", 14], ["网游小说", 15],
        ["修真小说", 16], ["女生", 17], ["其它小说", 18], ["二次元", 19]
    ];
    var out = [];
    for (var i = 0; i < g.length; i++) {
        out.push({
            title: g[i][0],
            input: BASE_URL + "/aggregation/" + g[i][1],
            script: "gen.js"
        });
    }
    return Response.success(out);
}
