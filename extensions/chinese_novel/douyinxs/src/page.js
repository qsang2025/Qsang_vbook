// page.js — Danh sach cac trang muc luc (execute(url) -> [url]).
//
// Muc luc phan trang qua #indexselect option tren trang chi tiet
// (kiem chung live 2026-11-15: 万族之劫 co 50 option, "1 - 20章" ..
// "981 - 1000章"). Gia tri option la URL day du tren host
// ba-dg.ddyyxs.cc — lay path roi gan BASE_URL (duong dan
// /bqg/<id>_<n>/ chay duoc tren m, kiem chung live: /bqg/223080_2/
// tra 200 voi dung 20 chuong ch.21-39).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = BASE_URL + "/bqg/" + id + "/";
    var r = fetchDyDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var pages = [];
    var seen = {};
    var options = doc.select("#indexselect option");
    var i = 0;
    for (i = 0; i < options.size(); i++) {
        var v = options.get(i).attr("value") || "";
        if (!v) continue;
        var link = absUrl(v);
        if (!link || seen[link]) continue;
        seen[link] = true;
        pages.push(link);
    }
    if (pages.length === 0) {
        pages.push(detailUrl);
    }
    return Response.success(pages);
}
