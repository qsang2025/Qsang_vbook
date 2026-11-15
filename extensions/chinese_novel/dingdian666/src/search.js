// search.js — Tim kiem truyen (execute(query, page) -> items, "").
//
// Form tim kiem cua site: POST /s.php, field "s" (kiem chung live
// 2026-11-15: POST "天师" tra ket qua that; GET /s.php?s=... tra
// trang rong vi site khong doc query nen bat buoc POST). Ket qua
// cung cau truc .lastupdate ul li nhu gen.js, khong phan trang
// nen next luon "".
// POST co luc treo tu VM (2 lan dau tra 000 roi moi 200) — co the
// la tarpit voi IP datacenter; test tren may that se quyet dinh
// giu hay bo file nay (tien le readernovel/aztruyen/lwxs/tushumi).
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

function execute(query, page) {
    var kw = String(query || "").replace(/^\s+|\s+$/g, "");
    if (!kw) return Response.error("Nhập từ khóa để tìm kiếm.");
    var r = fetchDdPostDoc(BASE_URL + "/s.php", "s=" + encodeURIComponent(kw));
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookRows(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + kw + "\"");
    }
    return Response.success(items, "");
}
