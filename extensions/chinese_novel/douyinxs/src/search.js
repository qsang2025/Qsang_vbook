// search.js — Tim kiem truyen (execute(query, page) -> items, "").
//
// Tim kiem cua site: GET /search/?searchkey=<kw> (kiem chung live
// 2026-11-15: "万族之劫" tra 16 muc .bookbox that, co ca
// 万族之劫 /bqg/223080/). POST /search/ treo tu VM (000 — co the
// la tarpit voi IP datacenter, nhu dingdian666) nen dung GET.
// Ket qua cung cau truc .read_book .bookbox, khong phan trang
// nen next luon "".
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
    var r = fetchDyDoc(BASE_URL + "/search/?searchkey=" + encodeURIComponent(kw));
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseBookBoxRows(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + kw + "\"");
    }
    return Response.success(items, "");
}
