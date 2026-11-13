// search.js — Tim kiem: GET /api/search?search=<tu-khoa>&page&limit=20.
// Site chap nhan tu khoa co dau (kiem chung 2026-11-13: "đế bá" -> 128
// ket qua, dau tien la Đế Bá) nen khong slug-hoa tu khoa.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var PAGE_LIMIT = 20;

function execute(query, page) {
    var keyword = query;
    if (typeof query === "object" && query !== null && query.length !== undefined) {
        keyword = query[0];
        page = query[1];
    }
    if (!keyword) return Response.success([], "");
    keyword = String(keyword).trim();
    if (!keyword) return Response.success([], "");
    if (!page) page = "1";

    var r = fetchTvApi("/api/search?search=" + encodeURIComponent(keyword) + "&page=" + encodeURIComponent(String(page)) + "&limit=" + PAGE_LIMIT);
    if (r.error) return Response.error(r.error);

    var json = r.json || {};
    var docs = json.docs || [];
    var data = [];
    for (var i = 0; i < docs.length; i++) {
        var item = buildBookItem(docs[i]);
        if (item) data.push(item);
    }
    if (data.length === 0) return Response.success([], "");

    var next = nextPageToken(json.totalDocs, PAGE_LIMIT, page);
    return Response.success(data, next);
}
