// cate.js — Danh sach truyen theo the loai
// (/api/categories/<slug>/books?slug=<slug>&page&limit=20). Input la
// slug the loai tu genre.js / detail.js.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

var PAGE_LIMIT = 20;

function execute(input, page) {
    if (!input) return Response.success([], "");
    if (!page) page = "1";
    var slug = String(input).trim();
    if (!slug) return Response.success([], "");

    var r = fetchTvApi("/api/categories/" + encodeURIComponent(slug) + "/books?slug=" + encodeURIComponent(slug) + "&page=" + encodeURIComponent(String(page)) + "&limit=" + PAGE_LIMIT);
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
