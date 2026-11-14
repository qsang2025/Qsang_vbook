// search.js — Tim kiem: /timkiem?s=<tu khoa>&page=N (endpoint tim kiem
// that cua site — cung endpoint site dung cho link "tim truyen cung tac
// gia" tren trang chi tiet; /tim-kiem?q= tra ve trang rong o phia server).
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(key, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    var q = String(key || "").trim();
    if (!q) return Response.success([], "");
    var rr = ttlFetchDoc(BASE_URL + "/timkiem?s=" + encodeURIComponent(q) + "&page=" + p);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var items = parseCards(doc);
    if (!items || items.length === 0) return Response.success([], "");
    return Response.success(items, getNextPage(doc, p));
}
